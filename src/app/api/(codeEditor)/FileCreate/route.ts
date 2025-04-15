import { NextRequest, NextResponse} from "next/server";
import fs from "fs"
import path from "path";
import { v4 as uuidv4 } from 'uuid';



export async function POST(req: NextRequest){
    try {
        const uniqueId = uuidv4();
        let fileName= uniqueId.toString() + ".asm";
    
        const filePath = path.join(process.cwd(), "public", fileName);
    
        await fs.promises.writeFile(filePath,"");
    
        if(!fs.existsSync(filePath)){
            return NextResponse.json({
                success: false,
                message: "Something went wrong while creating file"
            },{status: 500})
        }
    
        return NextResponse.json({
            success: true,
            message: "File Created Successfully",
            fileId: uniqueId
        },{status:200})
    
    } catch (error) {
        console.log(error)
        return NextResponse.json({
            success: false,
            message: "Server Error while creating file",
        },{status:500})
        
    }
}