import { NextRequest, NextResponse } from "next/server";
import fs from "fs"
import path from "path";


export async function GET(req: NextRequest,{params}: {params: {fileId: string}}){
    try {
        const {fileId} =await params;

        if(!fileId){
            return NextResponse.json({
                success: false,
                message: "File Id is required",
            },{status:404})
        }
    
        const fileName = fileId.toString() + ".asm"
        const filePath = path.join(process.cwd(), "public", fileName);
    
    
        if(!fs.existsSync(filePath)){
            return NextResponse.json({
                success: false,
                message: "File not found Please create new file"
            },{status:500})
        }
        const textData = await fs.promises.readFile(filePath,'utf8')


        return NextResponse.json({
            success: true,
            message: "File Data Fetched Successfully",
            textData: textData
        },{status:200})
    } catch (error) {
        console.log(error)

        return NextResponse.json({
            success: false,
            message: "Server Error while getting data from file"
        },{status:500})
        
    }
}