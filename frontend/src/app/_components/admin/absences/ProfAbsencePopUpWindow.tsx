"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onClose: () => void
  onAccept: () => void
  onReject: () => void
  absenceDate: string
  absenceCause: string
  justificationPdfUrl?: string  // URL or base64 data URI of the PDF
}

export default function ProfAbsencePopUpWindow({
  open,
  onClose,
  onAccept,
  onReject,
  absenceDate,
  absenceCause,
  justificationPdfUrl,
}: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-[860px] rounded-2xl border border-[#74A7BD]/30 bg-white shadow-xl mx-4 dark:border-[#74A7BD]/25 dark:bg-[#1A2036]">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-[#51689A]/25 bg-[#F6F7FE] text-[#1B2065] transition-colors hover:bg-[#E8ECF4] dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#EEF4F7] dark:hover:bg-[#383F58]"
          aria-label="Close"
        >
          <X size={15} strokeWidth={2} />
        </button>

        {/* Body — two-column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 min-h-[480px]">
          {/* Left — PDF viewer */}
          <div className="flex items-center justify-center rounded-tl-2xl rounded-bl-2xl bg-[#F6F7FE]/60 border-r border-[#D6DEEF] p-4 dark:bg-[#242A40]/60 dark:border-[#383F58]">
            {justificationPdfUrl ? (
              <iframe
                src={justificationPdfUrl}
                title="Justification document"
                className="h-[460px] w-full rounded-lg border border-[#D6DEEF] shadow-sm dark:border-[#383F58]"
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-[#51689A]/40 text-sm text-[#5D719D] dark:border-[#383F58] dark:text-[#9BA8C4]">
                No document uploaded
              </div>
            )}
          </div>

          {/* Right — details + actions */}
          <div className="flex flex-col justify-between px-8 py-10">
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-[#1B2065] dark:text-[#EEF4F7]">Absences details</h2>

              <div className="space-y-1.5">
                <p className="text-sm font-medium text-[#1B2065] dark:text-[#EEF4F7]">Absence date :</p>
                <p className="text-base font-semibold text-[#1B6EBF]">{absenceDate}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium text-[#1B2065] dark:text-[#EEF4F7]">Absence cause :</p>
                <p className="text-sm font-semibold text-[#1B2065] dark:text-[#EEF4F7]">{absenceCause}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={onAccept}
                className="rounded-lg border border-[#74A7BD] bg-white px-7 text-[#1B6EBF] hover:bg-[#F0F7FF] dark:border-[#74A7BD] dark:bg-[#152A38] dark:text-[#74A7BD] dark:hover:bg-[#152A38]/80"
              >
                Accept
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onReject}
                className="rounded-lg border border-[#E9A0A0] bg-[#FFF0F0] px-7 text-[#C0392B] hover:bg-[#FFE4E4] dark:border-[#E85462] dark:bg-[#3A1A22] dark:text-[#F0707A] dark:hover:bg-[#3A1A22]/80"
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