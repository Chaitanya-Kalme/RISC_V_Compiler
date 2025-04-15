'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
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


type MemoryValue = string;
type MemoryAddress = `0x${string}`;

export default function AssemblyPage() {
  const [assemblyDone, setAssemblyDone] = useState(false)
  const [isFileOpen, setIsFileOpen] = useState(false)
  const [assemblyCode, setAssemblyCode] = useState<assemblyCodeData[]>([])
  const [registerFileSelected, setRegisterFileSelected] = useState(true)
  const [memoryFileSelected, setMemoryFileSelected] = useState(false)
  const [registerFile, setRegisterFile] = useState<Record<string, string>>({})
  const [memoryFile, setMemoryFile] = useState<Record<string, string>>({})
  const [memoryAddress, setMemoryAddress] = useState("")
  const memoryRef = useRef(memoryFile)


  useEffect(() => {
    memoryRef.current = memoryFile;
  }, [memoryFile]);


  const assembleCode = async () => {
    const fileId = JSON.parse(localStorage.getItem("fileOpen") as string);

    if (!fileId) {
      toast.error("Please Open File To Assemble", {
        position: 'top-center',
      });
      return;
    }

    try {
      setIsFileOpen(true);

      await axios.post(`/api/assembly/${fileId}`);
      toast.success("Code Assembled successfully");

      const response = await axios.get(`/api/assembly/${fileId}`);
      const instructionList: assemblyCodeData[] = response.data.instructionList;
      setAssemblyCode(instructionList);
      setAssemblyDone(true)

    } catch (error) {
      console.error(error);
      toast.error("Error while assembling code");
    }
  }

  const sortedAddresses = useMemo(() => {
    return Object.keys(memoryFile)
      .filter((address) => /^0x[0-9A-Fa-f]{8}$/.test(address))
      .sort((a, b) => parseInt(a, 16) - parseInt(b, 16));
  }, [memoryFile]);

  useEffect(() => {
    let registers: Record<string, string> = {};
    for (let i = 0; i < 32; i++) {
      let register = "x" + i.toString();
      registers[register] = "0x00000000"
    }
    setRegisterFile(registers);

  }, [])

  const visibleAddresses = useMemo(() => {
    if (!memoryAddress || !sortedAddresses.includes(memoryAddress)) {
      return sortedAddresses.slice(0, 50); // Default to first 50
    }

    const index = sortedAddresses.indexOf(memoryAddress);
    const start = Math.max(0, index - 25);
    return sortedAddresses.slice(start, start + 50);
  }, [memoryAddress, sortedAddresses]);

  const memory = useRef<Record<MemoryAddress, MemoryValue>>(
    new Proxy({}, {
      get(_target, prop: string | symbol): MemoryValue {
        if (typeof prop === "string" && /^0x[0-9A-Fa-f]{8}$/.test(prop)) {
          return memoryRef.current[prop as MemoryAddress] ?? "0x00000000";
        }
        return "0x00000000";
      },
      set(_target, prop: string | symbol, value: any): boolean {
        if (typeof prop === "string" && /^0x[0-9A-Fa-f]{8}$/.test(prop)) {
          const address = prop as MemoryAddress;
          const strValue = String(value);
          setMemoryFile(prev => ({
            ...prev,
            [address]: strValue,
          }));
          return true;
        }
        return false;
      }
    })
  );

  // Initialize memory addresses with value 0x00000000
  useEffect(() => {
    const initialMemory: Record<string, string> = {};
    for (let i = 0; i < 100; i++) {  // Limit to 100 addresses for safety
      const address = `0x${(i * 4).toString(16).padStart(8, '0').toUpperCase()}`;
      initialMemory[address] = "00";
    }
    setMemoryFile(initialMemory);
  }, []);




  // Function to render the memory in +3, +2, +1, +0 format starting from a high address
  const renderMemoryRow = (startAddress: string) => {
    const row: string[] = [];
    const startAddressInt = parseInt(startAddress, 16);

    // Render values for +3, +2, +1, +0 by decrementing addresses
    for (let i = 3; i >= 0; i--) {
      const addr = `0x${(startAddressInt - i * 4).toString(16).padStart(2, '0').toUpperCase()}`;
      row.push(memoryFile[addr] || "00"); // Get the value from memoryFile or default to "00"
    }
    return row;
  };


  const runCode = async () => {
    const fileId = JSON.parse(localStorage.getItem("fileOpen") as string);
    try {
      await axios.post(`/api/runCode/${fileId}`);
      toast.success("Code Run successfully");
    } catch {
      toast.error("Error while running code")
    }
  }



  return (
    <div className='mt-30 mx-5'>
      <div className='text-center justify-center w-8/12'>
        <span className='space-x-3'>
          {assemblyDone && (
            <span className='space-x-3'>
              <button className="px-6 py-3 rounded-full bg-[#1ED760] font-bold text-white tracking-widest uppercase transform hover:scale-105 hover:bg-[#21e065] transition-colors duration-200" onClick={() => runCode()}>
                Run Code
              </button>
              <button className="shadow-[0_0_0_3px_#000000_inset] px-6 py-2 bg-transparent border border-black dark:border-white dark:text-white text-black rounded-lg font-bold transform hover:-translate-y-1 transition duration-400">
                Step
              </button>
              <button className="shadow-[0_0_0_3px_#000000_inset] px-6 py-2 bg-transparent border border-black dark:border-white dark:text-white text-black rounded-lg font-bold transform hover:-translate-y-1 transition duration-400">
                Prev
              </button>
              <button className="p-[3px] relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
                <div className="px-8 py-2  bg-black rounded-[6px]  relative group transition duration-200 text-white hover:bg-transparent">
                  Cycle Count:
                </div>
              </button>
            </span>
          )}
          <span>
            <button className="px-8 py-2 rounded-md bg-teal-500 text-white font-bold transition duration-200 hover:bg-white hover:text-black border-2 border-transparent hover:border-teal-500" onClick={() => assembleCode()}>
              Assemble Code
            </button>
          </span>
          <span className='flex right-0 w-full text-right'>
            <PlaceholdersAndVanishInput
              placeholders={["Enter the memory Address"]}
              onChange={(e) => setMemoryAddress(e.target.value)}
              onSubmit={() => visibleAddresses}
            />
          </span>
        </span>
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
                  {assemblyCode.map((instruction: assemblyCodeData, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-center text-lg">{instruction.pcAddress}</TableCell>
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
                  {Object.keys(memoryFile)
                    .filter((address) => /^0x[0-9A-Fa-f]{8}$/.test(address)) // Only valid addresses
                    .sort((a, b) => parseInt(a, 16) - parseInt(b, 16)) // Sort addresses in ascending order
                    .slice(0, 50) // Limit the number of rows (you can adjust this)
                    .map((address) => {
                      const rowValues = renderMemoryRow(address);
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
