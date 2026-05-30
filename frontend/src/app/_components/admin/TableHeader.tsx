"use client"

import { useState } from "react"
import { Funnel, Users } from "lucide-react"

import SearchBar from "./SearchBar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function TableHeader() {
  const [search, setSearch] = useState("")
  const [audience, setAudience] = useState("Professors")

  return (
    <div>
      <Card className="mb-[4vh] mt-[2vh] h-[calc(24vh-82px)] overflow-hidden border-[#51689A] bg-[#F6F7FE] shadow-md dark:border-[#383F58] dark:bg-[#1A2036]">
        <CardContent className="flex h-full flex-row items-center justify-between gap-4 overflow-hidden p-0">
          <div className="flex flex-row items-center gap-4 p-8">
            <Users className="text-[#1B2065F2] rounded-md border border-[#1B2065F2] dark:text-[#EEF4F7] dark:border-[#383F58]" />
            <p className="font-bold text-[#1B2065F2] dark:text-[#EEF4F7]">Schedule List</p>
          </div>
          <div className="flex items-center justify-end gap-4 px-5 py-7">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search schedules..."
            />
            <div className="relative flex min-w-[140px] items-center">
              <Funnel
                className="pointer-events-none absolute start-3 text-[#1B2065F2] dark:text-[#EEF4F7]"
                size={18}
                aria-hidden
              />
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger className="h-10 w-full rounded-xl border border-[#1B2065F2] bg-[#FEF9F9] ps-8 text-sm text-[#1B2065F2] dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#EEF4F7]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professors">Professors</SelectItem>
                  <SelectItem value="Students">Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
