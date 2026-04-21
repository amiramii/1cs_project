"use client"

import React from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Merged onto the input (e.g. schedule tab styling). */
  inputClassName?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  inputClassName,
}: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("h-10 rounded-md ps-10 pe-3", inputClassName)}
      />
      <Search
        className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        size={18}
        aria-hidden
      />
    </div>
  )
}