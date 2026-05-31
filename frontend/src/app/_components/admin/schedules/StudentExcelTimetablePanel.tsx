"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarDays } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  loadWeeklyTimetableSlots,
  resolveStudentGroupName,
  type GradeFilter,
  type TimetableSlotRow,
} from "@/lib/excelTimetableClient"
import { SessionTypeBadge } from "@/lib/SessionTypeBadge"

type Props = {
  isArabic: boolean
  gradeFilter: GradeFilter
  /** When true, only show rows for the logged-in student's group. */
  studentBrowse?: boolean
  /** Filter uploaded Excel by semester (S1 / S2). */
  semester?: "S1" | "S2"
}

export default function StudentExcelTimetablePanel({
  isArabic,
  gradeFilter,
  studentBrowse = false,
  semester = "S1",
}: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slots, setSlots] = useState<TimetableSlotRow[]>([])
  const [sourceTitle, setSourceTitle] = useState<string | null>(null)
  const [groupName, setGroupName] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let group: string | null = null
      if (studentBrowse) {
        group = await resolveStudentGroupName()
        setGroupName(group)
      } else {
        setGroupName(null)
      }
      const result = await loadWeeklyTimetableSlots({
        gradeFilter,
        groupName: studentBrowse ? group : null,
        semester,
      })
      setSlots(result.slots)
      setSourceTitle(result.sourceTitle)
    } catch {
      setError(
        isArabic
          ? "تعذر تحميل الجدول من ملف Excel."
          : "Could not load the timetable from Excel."
      )
      setSlots([])
      setSourceTitle(null)
    } finally {
      setLoading(false)
    }
  }, [gradeFilter, studentBrowse, semester, isArabic])

  useEffect(() => {
    void load()
  }, [load])

  const title = useMemo(
    () =>
      isArabic
        ? studentBrowse
          ? "جدولك الأسبوعي"
          : "الجدول الأسبوعي (Excel)"
        : studentBrowse
          ? "Your weekly timetable"
          : "Weekly timetable (Excel)",
    [isArabic, studentBrowse]
  )

  return (
    <section className="w-full min-w-0 rounded-xl border border-[#51689A]/35 bg-[#FEF9F9] px-4 py-4 shadow-sm dark:border-[#383F58] dark:bg-[#1A2036]">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#51689A]/30 bg-white dark:border-[#383F58] dark:bg-[#242A40]">
            <CalendarDays
              className="size-4 text-[#1B2065] dark:text-[#EEF4F7]"
              aria-hidden
            />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1B2065] dark:text-[#EEF4F7]">
              {title}
            </h2>
            <p className="text-xs text-[#51689A] dark:text-[#9BA8C4]">
              {isArabic
                ? "Cours / TD / TP من ملف Excel المرفوع"
                : "Cours / TD / TP from the uploaded Excel file"}
              {sourceTitle ? ` · ${sourceTitle}` : ""}
              {studentBrowse && groupName
                ? isArabic
                  ? ` · ${groupName}`
                  : ` · Group ${groupName}`
                : ""}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="rounded-lg border border-[#51689A]/15 px-3 py-3 dark:border-[#383F58]"
            >
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
          {isArabic
            ? "لا توجد حصص في ملف Excel لهذا المستوى."
            : "No classes in the Excel file for this level."}
        </p>
      ) : (
        <div className="max-h-[min(28rem,50vh)] overflow-auto rounded-lg border border-[#51689A]/15 dark:border-[#383F58]">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-[1] bg-[#51689A]/10 text-xs font-semibold uppercase tracking-wide text-[#1B2065] dark:bg-[#242A40] dark:text-[#EEF4F7]">
              <tr>
                <th className="px-3 py-2">{isArabic ? "اليوم" : "Day"}</th>
                <th className="px-3 py-2">{isArabic ? "الوقت" : "Time"}</th>
                <th className="px-3 py-2">{isArabic ? "المادة" : "Module"}</th>
                <th className="px-3 py-2">{isArabic ? "النوع" : "Type"}</th>
                <th className="px-3 py-2">{isArabic ? "القاعة" : "Room"}</th>
                {!studentBrowse ? (
                  <th className="px-3 py-2">{isArabic ? "المجموعة" : "Group"}</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, index) => (
                <tr
                  key={`${slot.day}-${slot.time_slot}-${slot.subject}-${index}`}
                  className="border-t border-[#51689A]/10 odd:bg-white/60 even:bg-[#F6F7FE]/80 dark:border-[#383F58] dark:odd:bg-[#1A2036]/40 dark:even:bg-[#242A40]/40"
                >
                  <td className="px-3 py-2 font-medium text-[#1B2065] dark:text-[#EEF4F7]">
                    {slot.day}
                  </td>
                  <td className="px-3 py-2 text-[#51689A] dark:text-[#9BA8C4]">
                    {slot.time_slot}
                  </td>
                  <td className="px-3 py-2 text-[#1B2065] dark:text-[#EEF4F7]">
                    {slot.subject}
                    {slot.professor ? (
                      <span className="mt-0.5 block text-xs text-[#51689A] dark:text-[#9BA8C4]">
                        {slot.professor}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <SessionTypeBadge type={slot.session_type} isAr={isArabic} />
                  </td>
                  <td className="px-3 py-2 text-[#51689A] dark:text-[#9BA8C4]">
                    {slot.room || "—"}
                  </td>
                  {!studentBrowse ? (
                    <td className="px-3 py-2 text-[#51689A] dark:text-[#9BA8C4]">
                      {slot.group || "—"}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
