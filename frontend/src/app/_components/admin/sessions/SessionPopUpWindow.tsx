"use client"

import { useState } from "react"
import { X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

type Semester = "S1" | "S2"

type SessionDetail = {
  date: string      // e.g. "04/02/2026"
  time: string      // e.g. "13:00"
  place: string     // e.g. "Salle A2"
  groups: string    // e.g. "G3/G4 · 1CS · Gestion des Projets"
  semester: Semester
}

type YearOption = {
  value: string
  label: string
}

const YEAR_OPTIONS: YearOption[] = [
  { value: "1CP", label: "1CP" },
  { value: "2CP", label: "2CP" },
  { value: "1CS", label: "1CS" },
  { value: "2CS", label: "2CS" },
  { value: "3CS", label: "3CS" },
  { value: "Doctorates", label: "Doctorates" },
]

type Props = {
  session: SessionDetail
  open: boolean
  onClose: () => void
  onAccept: (selectedYear: string) => void
  onReject: () => void
}

export default function SessionPopUpWindow({
  session,
  open,
  onClose,
  onAccept,
  onReject,
}: Props) {
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  if (!open) return null

  const handleAccept = () => {
    onAccept(selectedYear)
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Modal card */}
      <div className="relative w-full max-w-[480px] rounded-2xl border border-[#74A7BD]/30 bg-white shadow-xl mx-4">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-[#51689A]/25 bg-[#F6F7FE] text-[#1B2065] transition-colors hover:bg-[#E8ECF4]"
          aria-label="Close"
        >
          <X size={15} strokeWidth={2} />
        </button>

        {/* Header */}
        <div className="border-b border-[#D6DEEF] px-6 py-4">
          <h2 className="text-base font-semibold text-[#1B2065]">Sessions details</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Date / Place row */}
          <div className="text-center space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-[#5D719D]">
              Session Date/Place :
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <span className="text-[#1B6EBF] font-semibold text-base">
                {session.date} - {session.time}
              </span>
              <span className="text-[#1B2065] font-semibold text-base">
                {session.place}
              </span>
            </div>
          </div>

          {/* Select year + Groups */}
          <div className="grid grid-cols-2 gap-4 items-start">
            {/* Year selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#5D719D]">Select year:</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg border border-[#51689A]/35 bg-white px-3 py-2 text-sm text-[#1B2065] shadow-sm hover:bg-[#F6F7FE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#51689A]/40"
                >
                  <span className={selectedYear ? "text-[#1B2065]" : "text-[#5D719D]"}>
                    {selectedYear || "Year"}
                  </span>
                  <ChevronDown
                    size={15}
                    strokeWidth={2}
                    className={`text-[#5D719D] transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {dropdownOpen && (
                  <ul className="absolute z-10 mt-1 w-full rounded-lg border border-[#D6DEEF] bg-white py-1 shadow-lg">
                    {YEAR_OPTIONS.map((opt) => (
                      <li key={opt.value}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedYear(opt.value)
                            setDropdownOpen(false)
                          }}
                          className="flex w-full items-center justify-between px-3 py-1.5 text-sm text-[#1B2065] hover:bg-[#F6F7FE]"
                        >
                          {opt.label}
                          {selectedYear === opt.value && (
                            <span className="text-[#51689A] font-bold">✓</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Groups Concerned */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#5D719D]">Groups Concerned:</p>
              <p className="text-sm font-semibold text-[#1B2065] leading-snug">
                {session.groups}
              </p>
            </div>
          </div>
        </div>

        {/* Footer — Accept / Reject */}
        <div className="flex items-center justify-end gap-3 border-t border-[#D6DEEF] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleAccept}
            className="rounded-lg border border-[#74A7BD] bg-white px-6 text-[#1B6EBF] hover:bg-[#F0F7FF]"
          >
            Accept
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReject}
            className="rounded-lg border border-[#E9A0A0] bg-white px-6 text-[#C0392B] hover:bg-[#FFF0F0]"
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  )
}