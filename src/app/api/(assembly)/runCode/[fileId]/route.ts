import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs"
import { promisify } from "util";
import { exec as execCallback } from "child_process";
import { stderr, stdout } from "process";

const exec = promisify(execCallback)


export async function POST(req: NextRequest, { params }: { params: { fileId: string } }) {
    const { fileId } = await params

    if (!fileId) {
        return NextResponse.json({
            success: false,
            message: "File Id is required"
        }, { status: 404 })
    }

    const outputFileName = fileId.toString() + "_output.mc"
    const outputFilePath = path.join(process.cwd(), "public", outputFileName)

    if (!fs.existsSync(outputFilePath)) {
        return NextResponse.json({
            success: false,
            message: "File does not exist"
        }, { status: 500 })
    }
    const command = `java -cp src/app/api/(assembly)/runCode/\[fileId\]/ Execution public/${outputFileName}`;

    try {
        const { stdout, stderr } = await exec(command)
        console.log(stdout)
        console.log(stderr)
        return NextResponse.json({
            success: true,
            message: "Code Run Successfully"
        }, { status: 200 })

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "Error while executing file"
        })
    }


}