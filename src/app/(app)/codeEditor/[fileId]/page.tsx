"use client"
import React, { useEffect, useRef, useState } from 'react'
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
  
function page({params} :{params: {fileId: string}}) {
    const [fileId,setFileId] = useState("");
    const words = [
        {
          text: "Write",
        },
        {
          text: "Your",
        },
        {
          text: "Assembly",
        },
        {
          text: "Code",
        },
        {
          text: "Here.",
        },
      ];
      const [text,setText]= useState("")
      const textRef = useRef(text);
      const router= useRouter()

      useEffect(() =>{
        const getDataFromFile = async () =>{
          const param = await params;
          setFileId(param.fileId);
          await axios.get(`/api/getFileData/${param.fileId}`)
          .then((response) =>{
            setText(response.data.textData)
          })
          .catch((error) =>{
            toast.error(error.response.data.message)
          })
        }
        getDataFromFile();
        
      },[])

      useEffect(() =>{
        textRef.current = text;
      },[text])
      
      const updateFile = async () => {
        try {
          await axios.patch(`/api/updateFile/${await params.fileId}`, {
            textData: textRef.current,
          });
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to save file.");
        }
      };

      useEffect(() => {
        const interval = setInterval(() => {
          updateFile();
        }, 20000); 
    
        return () => clearInterval(interval); 
      }, [text]);


  return (
    <div className='mt-30 '>
        <div className='text-center justify-center w-full'>
            <TypewriterEffectSmooth words={words} className='text-center justify-center'/>
        </div>
        <div className='text-center justify-center gap-10 space-y-5 flex w-full'>
            <a href={`/${fileId}.asm`} download={`/${fileId}.asm`}>
            <Button>
              Download
            </Button>
            </a>
            <Button onClick={() => updateFile()}>Save</Button>
          <Button onClick={() => {
            localStorage.removeItem("fileOpen")
            router.replace('/')
          }}>Close File</Button>
        </div>
        <div className='text-center justify-center mx-7 text-3xl'>
          <Textarea className='min-h-screen text-lg' value={text} onChange={(e) => setText(e.target.value)}/>
        </div>
    </div>
  )
}

export default page