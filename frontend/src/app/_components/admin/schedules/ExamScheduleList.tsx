"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  MoveLeft,
  MoveRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import SearchBar from "../SearchBar"
import { useLanguage } from "@/app/_components/language-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { SCHEDULE_LIST_EMPTY_CLASS } from "@/lib/scheduleUiClasses"
import {
  loadAllExamSessions,
  type ExamSessionDetail,
} from "@/lib/checkinClient"
import { apiUnreachableMessage, isNetworkFailure } from "@/lib/fetchErrors"
import { getApiBaseUrl } from "@/lib/apiBase"

const PAGE_SIZE = 6

export default function ExamScheduleList() {
  const router = useRouter()
  const { language, dir } = useLanguage()
  const isArabic = language === "ar"
  const [items, setItems] = useState<ExamSessionDetail[]>([])
  const [search, setSearch] = useState("")
  const [gridPage, setGridPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await loadAllExamSessions()
      setItems(rows)
    } catch (err) {
      setError(
        isNetworkFailure(err)
          ? apiUnreachableMessage(getApiBaseUrl(), isArabic)
          : isArabic
            ? "تعذر تحميل الامتحانات."
            : "Could not load exam sessions."
      )
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [isArabic])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...items]
      .filter((item) => {
        if (!q) return true
        const teachers = item.teachers_list?.map((t) => `${t.name} ${t.email}`).join(" ") ?? ""
        return (
          item.module_name.toLowerCase().includes(q) ||
          item.room.toLowerCase().includes(q) ||
          item.date.toLowerCase().includes(q) ||
          teachers.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  }, [items, search])

  const filteredCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))
  const safePage = Math.min(gridPage, totalPages - 1)
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
  const showCarousel = !error && filteredCount > PAGE_SIZE

  useEffect(() => {
    setGridPage(0)
  }, [search])

  useEffect(() => {
    setGridPage((p) => Math.min(p, Math.max(0, totalPages - 1)))
  }, [totalPages])

  const carouselArrowClass =
    "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#1B2065]/85 text-white shadow-md transition-colors hover:!bg-[#1B2065] hover:!text-white focus-visible:!bg-[#1B2065] focus-visible:!text-white [&_svg]:shrink-0 [&_svg]:text-inherit disabled:pointer-events-none disabled:opacity-35"

  return (
    <section className="mt-4 flex min-h-[calc(100dvh-7.5rem)] w-full min-w-0 max-w-full flex-1 flex-col space-y-4 self-stretch">
      <div className="flex w-full max-w-full flex-wrap items-center justify-between gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/Scheduals/Excel-Schedules")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border-border bg-card px-3 text-sm text-foreground hover:bg-accent"
        >
          {dir === "rtl" ? <MoveRight size={18} /> : <MoveLeft size={18} />}
          <span className="hidden sm:inline">{isArabic ? "Excel" : "Excel"}</span>
        </Button>
        <h1 className="min-w-0 flex-1 text-center font-montserrat text-sm font-semibold text-foreground sm:text-xl xl:text-2xl">
          {isArabic ? "جلسات الامتحانات" : "Exam Sessions"}
        </h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/Scheduals")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border-border bg-card px-3 text-sm text-foreground hover:bg-accent"
        >
          <span className="hidden sm:inline">{isArabic ? "الرفع" : "Upload"}</span>
          {dir === "rtl" ? <MoveLeft size={18} /> : <MoveRight size={18} />}
        </Button>
      </div>

      <div className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-6 bg-transparent">
        <div className="flex w-full min-w-0 flex-col gap-4 rounded-xl border border-blue-primary/50 bg-[#F6F9FB] p-3 text-start shadow-md lg:flex-row lg:items-center lg:justify-between dark:border-[#74A7BD]/25 dark:bg-[#1A2036]">
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <div className="flex h-fit w-fit shrink-0 items-center justify-center rounded-sm border border-blue-primary bg-slate-50 dark:border-[#383F58] dark:bg-[#242A40]">
              <ClipboardList className="text-[#1B2065] dark:text-[#EEF4F7]" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-[#1B2065] dark:text-[#EEF4F7]">
                {isArabic ? "قائمة الامتحانات المرفوعة" : "Uploaded exam sessions"}
              </p>
              <p className="text-xs text-muted-foreground">
                {loading ? "…" : isArabic ? `${filteredCount} عنصر` : `${filteredCount} items`}
              </p>
            </div>
          </div>
          <div className="w-full min-w-0 shrink-0 sm:max-w-xs md:max-w-sm">
            <SearchBar value={search} onChange={setSearch} placeholder={isArabic ? "بحث..." : "Search..."} />
          </div>
        </div>

        {loading ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : null}

        {!loading ? (
          <div className={showCarousel ? "relative min-w-0 max-w-full px-2 sm:px-12 md:px-14" : "relative min-w-0 max-w-full"}>
            {showCarousel ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`${carouselArrowClass} start-0 sm:start-1`}
                  disabled={safePage <= 0}
                  onClick={() => setGridPage((p) => Math.max(0, p - 1))}
                >
                  {dir === "rtl" ? <ChevronRight className="size-6" /> : <ChevronLeft className="size-6" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`${carouselArrowClass} end-0 sm:end-1`}
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setGridPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  {dir === "rtl" ? <ChevronLeft className="size-6" /> : <ChevronRight className="size-6" />}
                </Button>
              </>
            ) : null}

            <div className="mt-4 grid min-h-[8rem] w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-4">
              {error ? (
                <div className="col-span-full flex min-h-[12rem] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-4 py-10 text-center">
                  <p className="text-sm font-medium text-destructive">{error}</p>
                </div>
              ) : null}
              {!error && filteredCount === 0 ? (
                <div className={cn("col-span-full", SCHEDULE_LIST_EMPTY_CLASS)}>
                  {isArabic ? "لا توجد امتحانات مرفوعة." : "No uploaded exam sessions found."}
                </div>
              ) : null}
              {!error &&
                visible.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-[#51689A]/25 bg-[#FEF9F9] p-4 shadow-sm dark:border-[#383F58] dark:bg-[#1A2036]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#51689A]/10 text-[#51689A] dark:bg-[#74A7BD]/15 dark:text-[#74A7BD]">
                        <CalendarCheck size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-semibold text-[#1B2065] dark:text-[#EEF4F7]">
                          {item.module_name}
                        </h2>
                        <p className="mt-0.5 text-xs font-medium text-[#51689A] dark:text-[#9BA8C4]">
                          {item.date} · {item.start_time}–{item.end_time}
                        </p>
                        <p className="mt-1 text-xs text-[#51689A] dark:text-[#9BA8C4]">
                          {isArabic ? "القاعة:" : "Room:"} {item.room}
                        </p>
                        <p className="mt-1 text-xs text-[#51689A] dark:text-[#9BA8C4]">
                          {isArabic ? "الحضور:" : "Attendance:"}{" "}
                          {item.attendances?.length ?? 0}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
