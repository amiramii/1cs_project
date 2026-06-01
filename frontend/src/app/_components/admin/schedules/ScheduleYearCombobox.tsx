"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const YEAR_OPTIONS = [
  { value: "All", labelEn: "All Years", labelAr: "كل السنوات" },
  { value: "1CP", labelEn: "1CP", labelAr: "1CP" },
  { value: "2CP", labelEn: "2CP", labelAr: "2CP" },
  { value: "1CS", labelEn: "1CS", labelAr: "1CS" },
  { value: "2CS", labelEn: "2CS", labelAr: "2CS" },
  { value: "3CS", labelEn: "3CS", labelAr: "3CS" },
  { value: "Doctorats", labelEn: "Doctorats", labelAr: "دكتوراه" },
] as const

type Props = {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  isArabic: boolean
  dynamicOptions?: { value: string; label: string }[]
}

/** Year selector as a dropdown (no cmdk) — frosted panel for readability over content. */
export default function ScheduleYearCombobox({
  value,
  onChange,
  disabled,
  isArabic,
  dynamicOptions,
}: Props) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

const selected = dynamicOptions
  ? dynamicOptions.find((o) => o.value === value)
  : YEAR_OPTIONS.find((o) => o.value === value)

const displayLabel = selected
  ? dynamicOptions
    ? (selected as { value: string; label: string }).label
    : isArabic
      ? (selected as typeof YEAR_OPTIONS[number]).labelAr
      : (selected as typeof YEAR_OPTIONS[number]).labelEn
  : null

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-between rounded-md font-normal"
          disabled={disabled}
          aria-expanded={open}
        >
          <span className="truncate">
            {displayLabel ?? (isArabic ? "السنة" : "Year")}
          </span>
          <ChevronDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[min(50vh,280px)] w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto border-border/50 bg-popover/75 p-0 shadow-xl backdrop-blur-xl backdrop-saturate-150 dark:bg-popover/80"
      >
      {dynamicOptions
        ? dynamicOptions.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              className="flex cursor-pointer items-center justify-between gap-2"
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              <span>{opt.label}</span>
              {value === opt.value
                ? <span className="shrink-0 text-xs text-primary">✓</span>
                : <span className="w-4 shrink-0" aria-hidden />}
            </DropdownMenuItem>
          ))
        : YEAR_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              className="flex cursor-pointer items-center justify-between gap-2"
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              <span>{isArabic ? opt.labelAr : opt.labelEn}</span>
              {value === opt.value
                ? <span className="shrink-0 text-xs text-primary">✓</span>
                : <span className="w-4 shrink-0" aria-hidden />}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
