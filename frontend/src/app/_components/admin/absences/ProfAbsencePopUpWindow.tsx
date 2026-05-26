"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onClose: () => void
  onAccept: () => void
  onReject: () => void
  absenceDate: string        // e.g. "04/02/2026"
  absenceCause: string       // e.g. "Illness (Cold)"
  justificationImageUrl?: string  // URL or base64 of the uploaded justification doc
}

export default function ProfAbsencePopUpWindow({
  open,
  onClose,
  onAccept,
  onReject,
  absenceDate,
  absenceCause,
  justificationImageUrl,
}: Props) {
  if (!open) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Modal card */}
      <div className="relative w-full max-w-[860px] rounded-2xl border border-[#74A7BD]/30 bg-white shadow-xl mx-4">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-[#51689A]/25 bg-[#F6F7FE] text-[#1B2065] transition-colors hover:bg-[#E8ECF4]"
          aria-label="Close"
        >
          <X size={15} strokeWidth={2} />
        </button>

        {/* Body — two-column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 min-h-[480px]">
          {/* Left — justification image */}
          <div className="flex items-center justify-center rounded-tl-2xl rounded-bl-2xl bg-[#F6F7FE]/60 border-r border-[#D6DEEF] p-6">
            {justificationImageUrl ? (
              <img
                src={justificationImageUrl}
                alt="Justification document"
                className="max-h-[460px] w-full object-contain rounded-lg border border-[#D6DEEF] shadow-sm"
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-[#51689A]/40 text-sm text-[#5D719D]">
                No document uploaded
              </div>
            )}
          </div>

          {/* Right — details + actions */}
          <div className="flex flex-col justify-between px-8 py-10">
            {/* Title */}
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-[#1B2065]">Absences details</h2>

              {/* Absence date */}
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-[#1B2065]">Absence date :</p>
                <p className="text-base font-semibold text-[#1B6EBF]">{absenceDate}</p>
              </div>

              {/* Absence cause */}
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-[#1B2065]">Absence cause :</p>
                <p className="text-sm font-semibold text-[#1B2065]">{absenceCause}</p>
              </div>
            </div>

            {/* Accept / Reject */}
            <div className="flex items-center gap-3 pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={onAccept}
                className="rounded-lg border border-[#74A7BD] bg-white px-7 text-[#1B6EBF] hover:bg-[#F0F7FF]"
              >
                Accept
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onReject}
                className="rounded-lg border border-[#E9A0A0] bg-[#FFF0F0] px-7 text-[#C0392B] hover:bg-[#FFE4E4]"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}