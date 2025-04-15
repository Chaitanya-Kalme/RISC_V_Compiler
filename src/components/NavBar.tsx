"use client";
import React, { useState } from "react";
import { HoveredLink, Menu, MenuItem, ProductItem } from "./ui/navbar-menu";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NavBar() {
    return (
        <div className="relative w-full flex items-center justify-center">
            <Navbar className="top-2" />
        </div>
    );
}

function Navbar({ className }: { className?: string }) {
    const [active, setActive] = useState<string | null>(null);
    const { setTheme } = useTheme()
    return (
        <div
            className={cn("fixed top-10 inset-x-0 max-w-full mx-auto z-50 text-xl text-center justify-center gap-x-2", className)}
        >
            <Menu setActive={setActive}>
                <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 w-1/4">
                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 font-medium text-white backdrop-blur-3xl whitespace-nowrap left-0 text-2xl">
                        ABC RISC-V Compiler
                    </span>
                </button>
                <div className="w-full flex items-center justify-center gap-5">
                    <button className="inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-gray-300 dark:border-slate-800 
                    bg-[linear-gradient(110deg,#f0f0f0,45%,#e0e0e0,55%,#f0f0f0)] dark:bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] 
                    bg-[length:200%_100%] px-6 font-medium text-gray-700 dark:text-slate-400 
                    transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 whitespace-nowrap">
                        <HoveredLink href="/">Home</HoveredLink>
                    </button>
                    <button className="inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-gray-300 dark:border-slate-800 
                    bg-[linear-gradient(110deg,#f0f0f0,45%,#e0e0e0,55%,#f0f0f0)] dark:bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] 
                    bg-[length:200%_100%] px-6 font-medium text-gray-700 dark:text-slate-400 
                    transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 whitespace-nowrap">
                        <HoveredLink href="/codeEditor">Code Editor</HoveredLink>
                    </button>
                    <button className="inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-gray-300 dark:border-slate-800 
                    bg-[linear-gradient(110deg,#f0f0f0,45%,#e0e0e0,55%,#f0f0f0)] dark:bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] 
                    bg-[length:200%_100%] px-6 font-medium text-gray-700 dark:text-slate-400 
                    transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 whitespace-nowrap">
                        <HoveredLink href="/Assembly">Assembly</HoveredLink>
                    </button>
                    <button className="inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-gray-300 dark:border-slate-800 
                    bg-[linear-gradient(110deg,#f0f0f0,45%,#e0e0e0,55%,#f0f0f0)] dark:bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] 
                    bg-[length:200%_100%] px-6 font-medium text-gray-700 dark:text-slate-400 
                    transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 whitespace-nowrap">
                        <HoveredLink href="/Pipelining">Pipelining</HoveredLink>
                    </button>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild className="justify-center text-center ml-auto">
                        <Button variant="outline" size="icon">
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            Light
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            System
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </Menu>
        </div>
    );
}
