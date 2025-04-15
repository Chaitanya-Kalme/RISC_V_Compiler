import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs"
import { stdout } from "process";
import { spawn } from 'child_process';
import { exec as execCallback } from "child_process";
import { promisify } from "util";

const exec = promisify(execCallback)


export async function POST(req: NextRequest, { params }: { params: { fileId: string } }) {
    const { fileId } = await params

    if (!fileId) {
        return NextResponse.json({
            success: false,
            message: "File Id is required"
        }, { status: 404 })
    }

    const fileName = fileId.toString() + ".asm"

    const filePath = path.join(process.cwd(), "public", fileName);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({
            success: false,
            message: "File does not exist"
        }, { status: 500 })
    }
    const outputFileName = fileId.toString() + "_output.mc"

    const outputFilePath = path.join(process.cwd(), "public", outputFileName)

    await fs.promises.writeFile(outputFilePath, "")

    const command = `java -cp src/app/api/(assembly)/assembly/\[fileId\]/ RiscVParser public/${fileName} public/${outputFileName}`;


    try {
        await exec(command)
        return NextResponse.json({
            success: true,
            message: "Code Assembled Successfully"
        }, { status: 200 })

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "Error while executing file"
        })
    }
}



export async function GET(req: NextRequest, { params }: { params: { fileId: string } }) {
    try {
        const { fileId } = await params;

        if (!fileId) {
            return NextResponse.json({
                success: false,
                message: "File Id is required",
            }, { status: 404 })
        }

        const fileName = fileId.toString() + "_output.mc"
        const filePath = path.join(process.cwd(), "public", fileName);


        if (!fs.existsSync(filePath)) {
            return NextResponse.json({
                success: false,
                message: "File not found Please create new file"
            }, { status: 500 })
        }
        const textData = await fs.promises.readFile(filePath, 'utf8')

        const parsedInstructions = textData
            .trim()
            .split('\n')
            .map(line => {
                const [beforeComma, afterComma] = line.split(',')
                if (!beforeComma || !afterComma) return null // skip bad lines

                const [address, machineCode] = beforeComma.trim().split(/\s+/)
                const instruction = afterComma.split('#')[0].trim()

                if (instruction.toLowerCase() === 'ends') return null

                return { pcAddress: address, machineCode, instruction }
            })
            .filter((inst): inst is { pcAddress: string; machineCode: string; instruction: string } => inst !== null)



        return NextResponse.json({
            success: true,
            message: "File Data Fetched Successfully",
            instructionList: parsedInstructions
        }, { status: 200 })
    } catch (error) {
        console.log(error)

        return NextResponse.json({
            success: false,
            message: "Server Error while getting data from file"
        }, { status: 500 })

    }
}