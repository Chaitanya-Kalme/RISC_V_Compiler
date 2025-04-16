'use client'
import React, { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input'

interface assemblyCodeData {
  pcAddress: string,
  instruction: string,
  machineCode: string
}

interface codeOutputData {
  pc: string,
  clock: number,
  ir: string | null,
  registerUpdate: { register: string, value: string } | null,
  memoryUpdate: { memoryAddr: string, value: string } | null
}

export default function AssemblyPage() {
  const [assemblyDone, setAssemblyDone] = useState(false)
  const [assemblyCode, setAssemblyCode] = useState<assemblyCodeData[]>([])
  const [registerFileSelected, setRegisterFileSelected] = useState(true)
  const [memoryFileSelected, setMemoryFileSelected] = useState(false)
  const [registerFile, setRegisterFile] = useState<Record<string, string>>({})
  const [memoryFile, setMemoryFile] = useState<Record<string, string>>({})
  const [memoryAddress, setMemoryAddress] = useState("0x000000C4")
  const [visibleMemoryAddress, setVisibleMemoryAddress] = useState<string[]>([])
  const [codeOutputResponse, setCodeOutputResponse] = useState<codeOutputData[]>([])
  const [tempRegisterFile,setTempRegisterFile] = useState<Record<string, string>>({})
  const [tempMemoryFile,setTempMemoryFile] = useState<Record<string, string>>({})
  const [index,setIndex] = useState(0)


  const assembleCode = async () => {
    const fileId = JSON.parse(localStorage.getItem("fileOpen") as string);

    if (!fileId) {
      toast.error("Please Open File To Assemble", {
        position: 'top-center',
      });
      return;
    }

    try {

      await axios.post(`/api/assembly/${fileId}`);
      toast.success("Code Assembled successfully");

      const response = await axios.get(`/api/assembly/${fileId}`);
      const instructionList: assemblyCodeData[] = response.data.instructionList;
      setAssemblyCode(instructionList);
      setAssemblyDone(true)

      const codeResponse = await axios.post(`/api/runCode/${fileId}`)
      setCodeOutputResponse(codeResponse.data.outputArray)
      console.log(codeResponse.data.outputArray)
      setTempMemoryFile(codeResponse.data.memoryState)
      setTempRegisterFile(codeResponse.data.registerFile)
    } catch (error) {
      console.error(error);
      toast.error("Error while assembling code");
    }
  }


  useEffect(() => {
    let registers: Record<string, string> = {};
    for (let i = 0; i < 32; i++) {
      let register = "x" + i.toString();
      registers[register] = "0x00000000"
    }
    registers["x2"]="0x7FFFFFDC"
    registers["x3"]="0x10000000"
    setRegisterFile(registers);
    setIndex(0)
  }, [assemblyCode])

  useEffect(() => {
    const initialMemory: Record<string, string> = {};
    for (let i = 0; i < 50; i++) {
      const address = `0x${(i * 4).toString(16).padStart(8, '0').toUpperCase()}`;
      initialMemory[address] = "00";
    }
    setMemoryFile(initialMemory);
  }, [assemblyCode]);



  const visibleAddresses = () => {

    let baseAddressInt = parseInt(memoryAddress, 16);
    if (baseAddressInt > 0x7FFFFFFC || baseAddressInt < 0x000000C4) {
      if (baseAddressInt > 0x7FFFFFFC) {
        toast.error("Address Out of Range")
        baseAddressInt = 0x7FFFFFFC
      }
      else if (baseAddressInt >= 0x00000000) {
        baseAddressInt = 0x000000C4
      }
      else {
        toast.error("Address Out of Range")
        baseAddressInt = 0x000000C4
      }
    }

    const visible: string[] = [];

    for (let row = 0; row < 50; row++) {
      const addr = `0x${(baseAddressInt - row * 4).toString(16).padStart(8, '0').toUpperCase()}`;
      visible.push(addr);
    }
    setVisibleMemoryAddress(visible)
    return visible;
  };


  useEffect(() => {
    const arr: string[] = visibleAddresses()
    setVisibleMemoryAddress(arr)
  }, [])




  const runCode = async () => {
    setRegisterFile(tempRegisterFile)
    setMemoryFile(tempMemoryFile)
    setIndex(codeOutputResponse.length-1)
    toast.success("Code Executed Successfully")
  }

  const increaseVisibleAddress = () => {
    let memoryAddressInt = parseInt(memoryAddress, 16)
    memoryAddressInt = memoryAddressInt + 100;

    if (memoryAddressInt > 0x7FFFFFFC || memoryAddressInt < 0x000000C4) {
      if (memoryAddressInt > 0x7FFFFFFC) {
        toast.error("Address Out of Range")
        memoryAddressInt = 0x7FFFFFFC
      }
      else if (memoryAddressInt >= 0x00000000) {
        memoryAddressInt = 0x000000C4
      }
      else {
        toast.error("Address Out of Range")
        memoryAddressInt = 0x000000C4
      }
    }
    const address = `0x${(memoryAddressInt).toString(16).padStart(8, '0').toUpperCase()}`
    setMemoryAddress(address)
    visibleAddresses();
  }

  const decreaseVisibleAddress = () => {
    let memoryAddressInt = parseInt(memoryAddress, 16)
    memoryAddressInt = memoryAddressInt - 100;

    if (memoryAddressInt > 0x7FFFFFFC || memoryAddressInt < 0x000000C4) {
      if (memoryAddressInt > 0x7FFFFFFC) {
        toast.error("Address Out of Range")
        memoryAddressInt = 0x7FFFFFFC
      }
      else if (memoryAddressInt >= 0x00000000) {
        memoryAddressInt = 0x000000C4
      }
      else {
        toast.error("Address Out of Range")
        memoryAddressInt = 0x000000C4
      }
    }
    const address = `0x${(memoryAddressInt).toString(16).padStart(8, '0').toUpperCase()}`
    setMemoryAddress(address)
    visibleAddresses();
  }


  const executeOneStep = () =>{
    if(index>=codeOutputResponse.length){
      toast.success("Code executed successfully")
      return null;
    }
    if(codeOutputResponse[index].registerUpdate!==null){
      const register = codeOutputResponse[index].registerUpdate.register
      setRegisterFile((prev) =>({
        ...prev,
        [register]: codeOutputResponse[index].registerUpdate?.value!
      }))
    }
    if (codeOutputResponse[index].memoryUpdate !== null) {
      const memoryAddrHex = codeOutputResponse[index].memoryUpdate.memoryAddr;
      const valueHex = codeOutputResponse[index].memoryUpdate.value.replace(/^0x/i, "").padStart(8, "0").toUpperCase();
      const baseAddr = parseInt(memoryAddrHex, 16);
    
      // Little-endian: LSB first
      const bytes = [
        valueHex.slice(6, 8), // byte 0
        valueHex.slice(4, 6), // byte 1
        valueHex.slice(2, 4), // byte 2
        valueHex.slice(0, 2), // byte 3
      ];
    
      setMemoryFile((prev) => {
        const newMem = { ...prev };
        for (let i = 0; i < 4; i++) {
          const addr = `0x${(baseAddr + i).toString(16).padStart(8, "0")}`;
          newMem[addr] = bytes[i];
        }
        return newMem;
      });
    }
    
    if (codeOutputResponse[index].pc && codeOutputResponse[index].ir) {
      const baseAddr = parseInt(codeOutputResponse[index].pc, 16);
      const irHex = codeOutputResponse[index].ir.replace(/^0x/i, "").padStart(8, "0").toUpperCase();
    
      // Split IR into bytes (little-endian: least significant byte first)
      const bytes = [
        irHex.slice(6, 8), // byte 0 (LSB)
        irHex.slice(4, 6), // byte 1
        irHex.slice(2, 4), // byte 2
        irHex.slice(0, 2), // byte 3 (MSB)
      ];
    
      setMemoryFile((prev) => {
        const newMem = { ...prev };
        for (let i = 0; i < 4; i++) {
          const addr = `0x${(baseAddr + i).toString(16).padStart(8, "0")}`;
          newMem[addr] = bytes[i];
        }
        return newMem;
      });
    }
    setIndex(index+1);
  }
  
  const goPrevious = () =>{
    if(index<0){
      toast.error("Can not go Previous")
      return null;
    }
    setIndex(index-1);
  }




  return (
    <div className='mt-30 mx-5'>
      <div className='space-x-3 flex whitespace-nowrap'>
        {assemblyDone && (
          <span className='space-x-3 ml-21'>
            <button className="px-6 py-3 rounded-full bg-[#1ED760] font-bold text-white tracking-widest uppercase transform hover:scale-105 hover:bg-[#21e065] transition-colors duration-200" onClick={() => runCode()}>
              Run Code
            </button>
            <button className="shadow-[0_0_0_3px_#000000_inset] px-6 py-2 bg-transparent border border-black dark:border-white dark:text-white text-black rounded-lg font-bold transform hover:-translate-y-1 transition duration-400" onClick={() => executeOneStep()}>
              Step
            </button>
            <button className="shadow-[0_0_0_3px_#000000_inset] px-6 py-2 bg-transparent border border-black dark:border-white dark:text-white text-black rounded-lg font-bold transform hover:-translate-y-1 transition duration-400" onClick={() => goPrevious()}>
              Prev
            </button>
            <button className="p-[3px] relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
              <div className="px-8 py-2  bg-black rounded-[6px]  relative group transition duration-200 text-white hover:bg-transparent">
                Cycle Count: {codeOutputResponse[index]? codeOutputResponse[index].clock-1: "0"}
              </div>
            </button>
          </span>
        )}
        <span className={`${assemblyDone ? "" : "ml-130"}`}>
          <button className="px-8 py-2 rounded-md bg-teal-500 text-white font-bold transition duration-200 hover:bg-white hover:text-black border-2 border-transparent hover:border-teal-500" onClick={() => assembleCode()}>
            Assemble Code
          </button>
        </span>
        {memoryFileSelected && (<span className='flex w-full ml-34 gap-x-5'>
          <PlaceholdersAndVanishInput
            placeholders={["Enter the memory Address"]}
            onChange={(e) => setMemoryAddress(e.target.value)}
            onSubmit={() => visibleAddresses()}
          />
          <button className="px-4 py-2 rounded-xl border border-neutral-600 text-black bg-white hover:bg-gray-100 transition duration-200" onClick={() => increaseVisibleAddress()}>
            Up
          </button>
          <button className="px-4 py-2 rounded-xl border border-neutral-600 text-black bg-white hover:bg-gray-100 transition duration-200" onClick={() => decreaseVisibleAddress()}>
            Down
          </button>
        </span>)}
      </div>
      <div className='text-center justify-center w-8/12'>
        <div className=' flex flex-row gap-4'>
          <div className="border border-gray-300 rounded-md min-w-11/12 mt-5 overflow-x-auto overflow-y-scroll h-120 ">
            {assemblyDone && (
              <Table className="text-center w-full table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4 text-center text-2xl">PC</TableHead>
                    <TableHead className="w-1/4 text-center text-2xl">Machine Code</TableHead>
                    <TableHead className="w-1/2 text-center text-2xl">Instruction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codeOutputResponse.length>0 &&  assemblyCode.map((instruction: assemblyCodeData,) => (
                    <TableRow key={instruction.pcAddress} className={`${index<codeOutputResponse.length &&  codeOutputResponse[index].ir!==null && codeOutputResponse[index].ir ==instruction.machineCode.toUpperCase()?  "bg-amber-300":""}`}>
                      <TableCell className="text-center text-lg" >{instruction.pcAddress}</TableCell>
                      <TableCell className="text-center text-lg">{instruction.machineCode}</TableCell>
                      <TableCell className="text-center text-lg">{instruction.instruction}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="border border-gray-300 rounded-md mt-5 min-w-7/12 right-0 ml-auto overflow-x-auto overflow-y-scroll h-120">
            <div className="flex justify-evenly py-4 border-b border-gray-200">
              <Button
                className={`hover:cursor-pointer px-6 py-2 text-lg ${registerFileSelected ? 'font-bold underline' : ''}`}
                onClick={() => {
                  setRegisterFileSelected(true);
                  setMemoryFileSelected(false);
                }}
              >
                Register
              </Button>
              <Button
                className={`hover:cursor-pointer px-6 py-2 text-lg ${memoryFileSelected ? 'font-bold underline' : ''}`}
                onClick={() => {
                  setRegisterFileSelected(false);
                  setMemoryFileSelected(true);
                }}
              >
                Memory
              </Button>
            </div>
            <Table className="text-center w-full justify-center">
              {registerFileSelected && (
                <TableBody>
                  {Object.entries(registerFile).map(([regName, value]: any, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center text-lg">{regName}</TableCell>
                      <TableCell className="text-center text-lg">{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
              {memoryFileSelected && (
                <TableBody>
                  <TableRow className="w-full justify-center text-center">
                    <TableHead className="text-center text-2xl">Address</TableHead>
                    <TableHead className="text-center text-2xl">+3</TableHead>
                    <TableHead className="text-center text-2xl">+2</TableHead>
                    <TableHead className="text-center text-2xl">+1</TableHead>
                    <TableHead className="text-center text-2xl">+0</TableHead>
                  </TableRow>
                  {visibleMemoryAddress && visibleMemoryAddress.map((address) => {
                    const startAddressInt = parseInt(address, 16);
                    const rowValues = [];

                    for (let i = 3; i >= 0; i--) {
                      const addr = `0x${(startAddressInt + i).toString(16).padStart(8, '0').toUpperCase()}`;
                      rowValues.push(memoryFile[addr] || "00");
                    }
                    return (
                      <TableRow key={address}>
                        <TableCell>{address}</TableCell>
                        {rowValues.map((value, index) => (
                          <TableCell key={index} className="text-center text-lg font-mono">
                            {value}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              )}
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
