"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Language } from "@/lib/constants"

type LanguageMenuProps = {
  language: Language
  onChange: (language: Language) => void
}

export default function LanguageMenu({ language, onChange }: LanguageMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild className="rounded-md">
        <Button
          size="sm"
          variant="ghost"
          className="justify-between bg-transparent font-light text-[#1B2065] shadow-none hover:bg-transparent dark:text-[#EEF4F7] dark:hover:bg-transparent"
        >
          {language === "en" ? "English" : "العربية"}
          {open ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="min-w-[min(100vw-2rem,7rem)] border-[#D6DEEF] bg-[#FEF9F9] p-0 dark:border-[#383F58] dark:bg-[#1A2036]"
      >
        <DropdownMenuItem onClick={() => onChange("en")}>English</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("ar")}>العربية</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
