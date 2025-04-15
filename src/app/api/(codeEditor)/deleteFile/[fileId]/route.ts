import { NextRequest, NextResponse } from "next/server";
import fs from "fs"
import path from "path";


export async function DELETE(req: NextRequest,{params}: {params: {fileId: string}}){
    try {
        const {fileId} =await params;

        if(!fileId){
            return NextResponse.json({
                success: false,
                message: "File Id is required",
            },{status:404})
        }
    
        const fileName = fileId.toString() + ".asm"
        const outputFileName = fileId.toString() +"_output.mc"
        const filePath = path.join(process.cwd(), "public", fileName);
        const outputFilePath = path.join(process.cwd(), "public",outputFileName);
        
        await fs.promises.unlink(filePath)
        await fs.promises.unlink(outputFilePath)
    
        if(fs.existsSync(filePath)){
            return NextResponse.json({
                success: false,
                message: "Error while deleting file"
            },{status:500})
        }
        if(fs.existsSync(outputFilePath)){
            return NextResponse.json({
                success: false,
                message: "Error while deleting file"
            },{status:500})
        }


        return NextResponse.json({
            success: true,
            message: "File deleted Successfully",
        },{status:200})
    } catch (error) {
        console.log(error)
        return NextResponse.json({
            success: false,
            message: "Server Error while deleting file"
        },{status:500})
        
    }
}