"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Semester = "S1" | "S2"

type SessionDetail = {
  date: string
  time: string
  place: string
  groups: string
  semester: Semester
}

type Props = {
  session: SessionDetail
  open: boolean
  onClose: () => void
  onAccept: () => void
  onReject: () => void
}

export default function SessionPopUpWindow({
  session,
  open,
  onClose,
  onAccept,
  onReject,
}: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative mx-4 w-full max-w-[480px] rounded-2xl border border-[#74A7BD]/30 bg-white shadow-xl dark:border-[#74A7BD]/25 dark:bg-[#1A2036]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-[#51689A]/25 bg-[#F6F7FE] text-[#1B2065] transition-colors hover:bg-[#E8ECF4] dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#EEF4F7] dark:hover:bg-[#383F58]"
          aria-label="Close"
        >
          <X size={15} strokeWidth={2} />
        </button>

        <div className="border-b border-[#D6DEEF] px-6 py-4 dark:border-[#383F58]">
          <h2 className="text-base font-semibold text-[#1B2065] dark:text-[#EEF4F7]">
            Session details
          </h2>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-1 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-[#5D719D] dark:text-[#9BA8C4]">
              Session date / time / place
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="text-base font-semibold text-[#1B6EBF] dark:text-[#74A7BD]">
                {session.date} — {session.time}
              </span>
              {session.place && session.place !== "—" ? (
                <span className="text-base font-semibold text-[#1B2065] dark:text-[#EEF4F7]">
                  {session.place}
                </span>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[#5D719D] dark:text-[#9BA8C4]">
              Groups concerned
            </p>
            <p className="text-sm font-semibold leading-snug text-[#1B2065] dark:text-[#EEF4F7]">
              {session.groups}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#D6DEEF] px-6 py-4 dark:border-[#383F58]">
          <Button
            type="button"
            variant="outline"
            onClick={onAccept}
            className="rounded-lg border border-[#74A7BD] bg-white px-6 text-[#1B6EBF] hover:bg-[#F0F7FF] dark:border-[#74A7BD] dark:bg-[#152A38] dark:text-[#74A7BD] dark:hover:bg-[#152A38]/80"
          >
            Accept
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReject}
            className="rounded-lg border border-[#E9A0A0] bg-white px-6 text-[#C0392B] hover:bg-[#FFF0F0] dark:border-[#E85462] dark:bg-[#3A1A22] dark:text-[#F0707A] dark:hover:bg-[#3A1A22]/80"
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  )
}
