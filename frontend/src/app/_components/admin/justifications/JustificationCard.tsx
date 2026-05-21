"use client"

import { FileText } from "lucide-react"

type JustificationCardProps = {
  index: number
  startDate: string
  endDate: string
  cause: string
  pdfPath?: string
  onViewDetails?: () => void
}

export default function JustificationCard({
  index,
  startDate,
  endDate,
  cause,
  onViewDetails,
}: JustificationCardProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#51689A] bg-[#F6F7FE] px-6 py-5 text-center shadow-sm w-full max-w-xs">
      <p className="text-sm font-medium text-[#51689AF2]">
        Justification {index} :
      </p>

      <p className="text-base font-bold text-[#74A7BD]">
        {startDate} - {endDate}
      </p>

      <div className="space-y-1">
        <p className="text-sm font-bold text-[#1B2065F2]">Absence cause :</p>
        <p className="text-sm text-[#1B2065F2]">{cause}</p>
      </div>

      <button
        onClick={onViewDetails}
        className="mt-1 flex items-center gap-2 rounded-xl bg-[#51689A] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#2e3f66] active:scale-95"
      >
        <FileText size={16} strokeWidth={1.75} />
        Justification file
      </button>
    </div>
  )
}