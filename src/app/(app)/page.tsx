"use client"

import React, { useEffect, useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Router } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import axios from "axios"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export type localStorageFileData = {
  fileName: string,
  fileId: string
}


export const columns: ColumnDef<localStorageFileData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: any) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "fileName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          File Name 
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => <div className="text-lg">{row.getValue("fileName")}</div>,
  },
  {
    accessorKey: "fileId",

    cell: ({ row }) => <div className="text-lg">{row.getValue("fileId")}</div>,
    enableHiding: true
  },
  {
    accessorKey: "open",
    header: ({ column }) => {
      return (
        <div></div>
      )
    },
    cell: ({ row }) => {
      const fileId = row.getValue("fileId");
      const router= useRouter();
      return(
        <Button onClick={() => {
          localStorage.setItem("fileOpen",JSON.stringify(fileId))
          router.replace(`/codeEditor/${fileId}`)}
        }>Open</Button>
      )
    }
  },
  {
    accessorKey: "delete",
    header: ({ column }) => {
      return (
        <div></div>
      )
    },
    cell: ({ row }) => {
      const fileId= row.getValue("fileId");
      const deleteFile = async () =>{
        await axios.delete(`/api/deleteFile/${fileId}`)
        .then((response) =>{
          const files: localStorageFileData[]= (localStorage.getItem("files") ? JSON.parse(localStorage.getItem("files") as string) : [])
          location.reload();
          const newFiles = files.filter((file) =>(file.fileId!==fileId))
          localStorage.setItem("files",JSON.stringify(newFiles))
          
          toast.success(response.data.message)

        })
        .catch((error) =>{
          toast.error(error.response.data.message)
        })
      }
      return(
        <Button onClick={() => deleteFile()}>Delete</Button>
      )
    }
  },

]


export default function Home() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      fileId: false
    })
  const [rowSelection, setRowSelection] = React.useState({})
  const [files, setFiles] = useState<localStorageFileData[]>([])
  const [nameOfFileToCreate,setNameOfFileToCreate] = useState("")
  const router = useRouter()

  useEffect(() => {
    const localStorageFiles = localStorage.getItem("files")
    setFiles(localStorageFiles ? JSON.parse(localStorageFiles) : []);
  }, [])

  const table = useReactTable({
    data: files,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })
  const createFile = () =>{
    const sendRequestForCreatingFile = async () =>{
      console.log("Enterd")
      await axios.post('api/FileCreate')
      .then((response) =>{
        const fileId = response.data.fileId as string;
        let dataToInsert: localStorageFileData={
          fileId: fileId,
          fileName: nameOfFileToCreate,
        }
        files.push(dataToInsert);
        localStorage.setItem("files",JSON.stringify(files))
        localStorage.setItem("fileOpen",JSON.stringify(fileId))
        toast.success("File Created Successfully")
        router.replace(`/codeEditor/${fileId}`)
      })
      .catch((error) =>{
        console.log(error.response)
        toast.error(error.response.data.message)
      })
    }
    sendRequestForCreatingFile();

  }

  return (
    <div className="w-full mt-30">
      <div className="flex items-center py-4 gap-x-10 mx-5">
        <Input
          placeholder="Filter File..."
          value={(table.getColumn("fileName")?.getFilterValue() as string) ?? ""}
          onChange={(event: any) =>
            table.getColumn("fileName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Dialog >
          <DialogTrigger asChild className="w-full">
            <Button variant="outline" className="text-center justify-center w-fit">Create File</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create File</DialogTitle>
              <DialogDescription>
                Create your RISC-V File by Entering file Name.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  File Name
                </Label>
                <Input id="name" value={nameOfFileToCreate} placeholder="Enter File Name" className="col-span-3" onChange={(e) => setNameOfFileToCreate(e.target.value)}/>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => createFile()}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide() && column.id!=="fileId")
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border m-5">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
