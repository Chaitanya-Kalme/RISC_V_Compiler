import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs"
import { promisify } from "util";
import { exec as execCallback } from "child_process";
import { stderr, stdout } from "process";

const exec = promisify(execCallback)


function parseOutput(output: string) {
    const outputArray: Array<{
        pc: string,
        clock: number,
        ir: string | null,
        registerUpdate: { register: string, value: string } | null,
        memoryUpdate: { memoryAddr: string, value: string } | null
    }> = [];

    const pcBlocks = output.split(/--------------------------------------------------/).filter(block => block.trim().length > 0);

    pcBlocks.forEach(block => {
        let pc: string = '';
        let clock: number = -1;
        let ir: string | null = null;
        let registerUpdate: { register: string, value: string } | null = null;
        let memoryUpdate: { memoryAddr: string, value: string } | null = null;

        // Match PC
        const pcMatch = block.match(/PC:\s*(0x[0-9A-Fa-f]+)/);
        if (pcMatch) {
            pc = pcMatch[1];
        }

        // Match Clock Cycle
        const clockMatch = block.match(/Clock Cycle:\s*(\d+)/);
        if (clockMatch) {
            clock = parseInt(clockMatch[1], 10);
        }

        const irMatch = block.match(/Instruction Register \(IR\):\s*(0[xX][0-9a-fA-F]+)/);
        if (irMatch) {
            ir = irMatch[1]; // Normalize to consistent casing
        }

        // Match Register Update
        const regMatch = block.match(/WriteBack: Register (\w+) updated with (0x[0-9A-Fa-f]+)/);
        if (regMatch) {
            registerUpdate = {
                register: regMatch[1],
                value: regMatch[2]
            };
        }


        // Match Memory Store
        const memStore = block.match(/Stored Value \(MDR\): (0x[0-9A-Fa-f]+) to Address \(MAR\): (0x[0-9A-Fa-f]+)/);
        if (memStore) {
            memoryUpdate = {
                memoryAddr: memStore[2],
                value: memStore[1]
            };
        }

        // Push final result
        outputArray.push({
            pc,
            clock,
            ir,
            registerUpdate,
            memoryUpdate
        });
    });
    const registerFile: Record<string, string> = {};
    const memoryState: Record<string, string> = {};

    // Extract the Register File State section
    const regStart = output.indexOf("Register File State:");
    const memStart = output.indexOf("Final Memory State:");
    if (regStart === -1 || memStart === -1) {
        console.error("Could not find register or memory section.");
        return { registerFile, memoryState };
    }

    const regSection = output.substring(regStart + "Register File State:".length, memStart).trim();
    const regLines = regSection.split('\n');

    // Match register lines like: "  x0: 0   x1: 5   x2: 0   x3: 0 "
    for (const line of regLines) {
        const regex = /x(\d+):\s*([^\s]+)/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
            const reg = `x${match[1]}`;
            const val = match[2];
            registerFile[reg] = val;
        }
    }

    // Extract the Final Memory State section
    const memSection = output.substring(memStart + "Final Memory State:".length).trim();
    const memLines = memSection.split('\n');

    // Match memory lines like: "0x1000: 00000005"
    for (const line of memLines) {
        const [addr, val] = line.split(":").map(s => s.trim());
        if (addr && val) {
            memoryState[addr] = val;
        }
    }

    return { registerFile, memoryState, outputArray };
}



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
        const { registerFile, memoryState, outputArray } = parseOutput(stdout);
        if (Object.keys(registerFile).length === 0 || Object.keys(memoryState).length === 0) {
            return NextResponse.json({
                success: false,
                message: "Error while fetching the register file state and memory state"
            })
        }

        return NextResponse.json({
            success: true,
            message: "Code Run Successfully",
            registerFile: registerFile,
            memoryState: memoryState,
            outputArray: outputArray
        }, { status: 200 })

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "Error while executing file"
        })
    }
}