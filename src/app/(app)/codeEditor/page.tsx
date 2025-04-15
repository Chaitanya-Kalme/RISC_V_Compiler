"use client"
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

export default function CodeEditorHomePage() {

  const [isFileOpen,setIsFileOpen]= useState(false)
  const [fileId,setFileId] = useState("")
  const router= useRouter()

  useEffect(() =>{
    const isFile = JSON.parse(localStorage.getItem("fileOpen") as string)
    if(isFile){
      setIsFileOpen(true)
      setFileId(isFile)
      router.replace(`/codeEditor/${isFile}`)
    }
  },[])

  if(!isFileOpen){
    return (
      <div className='mt-30 text-center justify-center text-3xl font-bold italic'>Please Create Your File and Start Coding </div>
    )
  }

}
