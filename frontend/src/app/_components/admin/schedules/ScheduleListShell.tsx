"use client"

/**
 * Shared shell for schedule PDF lists (professor list vs student single-PDF view).
 * Student timetable notifications: after the latest PDF resolves, we notify once
 * so learners know they can scroll without staring at the loading state.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Funnel,
  Users,
  MoveLeft,
  MoveRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import SearchBar from "../SearchBar"
import { useLanguage } from "@/app/_components/language-provider"
import { getAccessToken } from "@/lib/tokenStorage"
import { apiUnreachableMessage, isNetworkFailure } from "@/lib/fetchErrors"
import { notifyUser } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import PdfPreview from "./PdfPreview"

type ScheduleListShellProps = {
  titleEn: string
  titleAr: string
  backHref: string
  nextHref: string
  backLabelEn: string
  backLabelAr: string
  nextLabelEn: string
  nextLabelAr: string
  audience: "student" | "professor"
  /** Student timetable: one PDF only — no list, search, or grade filter */
  layout?: "list" | "single"
  /** Show delete control on each card (professor list / staff only). */
  allowDelete?: boolean
}

type ScheduleItem = {
  id: number | string
  title: string
  pdf: string
  audience: "student" | "teacher" | "professor"
  uploaded_at: string
}

type ApiResponse = {
  count?: number
  next?: string | null
  previous?: string | null
  results: ScheduleItem[]
}

type GradeFilter = "all" | "1CP" | "2CP" | "1CS" | "2CS" | "3CS" | "DOCTORATE"

const extractGrade = (title: string): Exclude<GradeFilter, "all"> | null => {
  const normalized = title.toUpperCase().replace(/\s+/g, "")
  if (normalized.includes("1CP")) return "1CP"
  if (normalized.includes("2CP")) return "2CP"
  if (normalized.includes("3CS") || normalized.includes("5CS")) return "3CS"
  if (normalized.includes("2CS")) return "2CS"
  if (normalized.includes("1CS")) return "1CS"
  if (
    normalized.includes("DOCTORATE") ||
    normalized.includes("DOCTORAT") ||
    normalized.includes("PHD") ||
    normalized.includes("دكتوراه")
  ) {
    return "DOCTORATE"
  }
  return null
}

/** Visible cards per “page” (3×2 on large screens). */
const SCHEDULE_PAGE_SIZE = 6

const scheduleCardGridClass =
  "mt-4 grid min-h-[8rem] w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-4"

const carouselArrowClass =
  "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#1B2065]/85 text-white shadow-md transition-colors hover:!bg-[#1B2065] hover:!text-white focus-visible:!bg-[#1B2065] focus-visible:!text-white [&_svg]:shrink-0 [&_svg]:text-inherit disabled:pointer-events-none disabled:opacity-35"

function ScheduleGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div
      className={scheduleCardGridClass}
      role="status"
      aria-busy="true"
      aria-label="Loading schedules"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <Skeleton className="h-[168px] w-full rounded-none bg-muted/80" />
          <div className="grid grid-cols-2 divide-x divide-slate-200 bg-white py-2">
            <Skeleton className="mx-2 h-3 justify-self-center bg-muted/90" />
            <Skeleton className="mx-2 h-3 justify-self-center bg-muted/90" />
          </div>
          <Skeleton className="h-9 w-full rounded-none bg-muted" />
        </div>
      ))}
    </div>
  )
}

function ScheduleSingleSkeleton() {
  return (
    <div
      className="w-full min-w-0 max-w-full space-y-3"
      role="status"
      aria-busy="true"
      aria-label="Loading schedule"
    >
      <div className="flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Skeleton className="h-[168px] w-full rounded-none bg-muted/80" />
        <div className="grid grid-cols-2 divide-x divide-slate-200 bg-white py-2">
          <Skeleton className="mx-2 h-3 justify-self-center bg-muted/90" />
          <Skeleton className="mx-2 h-3 justify-self-center bg-muted/90" />
        </div>
        <Skeleton className="h-9 w-full rounded-none bg-muted" />
      </div>
    </div>
  )
}

export default function ScheduleListShell({
  titleEn,
  titleAr,
  backHref,
  nextHref,
  backLabelEn,
  backLabelAr,
  nextLabelEn,
  nextLabelAr,
  audience,
  layout = "list",
  allowDelete = false,
}: ScheduleListShellProps) {
  const [search, setSearch] = useState("")
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all")
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | string | null>(null)
  const [gridPage, setGridPage] = useState(0)
  const router = useRouter()
  const { language, dir } = useLanguage()
  const isArabic = language === "ar"
  const title = isArabic ? titleAr : titleEn
  const backLabel = isArabic ? backLabelAr : backLabelEn
  const nextLabel = isArabic ? nextLabelAr : nextLabelEn
  const backendAudience = audience === "professor" ? "teacher" : "student"
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "")

  const normalizePdfUrl = useCallback(
    (rawUrl: string) => {
      if (!rawUrl) return rawUrl
      if (/^https?:\/\//i.test(rawUrl)) return rawUrl
      if (rawUrl.startsWith("/")) return `${apiBase}${rawUrl}`
      return `${apiBase}/${rawUrl}`
    },
    [apiBase]
  )

  useEffect(() => {
    let active = true

    const fetchSchedules = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = getAccessToken()
        const response = await fetch(`${apiBase}/api/documents/?audience=${backendAudience}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })

        const rawText = await response.text()
        let parsed: unknown = null
        try {
          parsed = rawText ? JSON.parse(rawText) : null
        } catch {
          parsed = null
        }

        if (!response.ok) {
          throw new Error(rawText || "Failed to fetch schedules")
        }

        const data =
          parsed && typeof parsed === "object" && parsed !== null
            ? (parsed as ApiResponse & { results?: ScheduleItem[] })
            : null
        const rawList: ScheduleItem[] = Array.isArray(parsed)
          ? (parsed as ScheduleItem[])
          : Array.isArray(data?.results)
            ? data!.results!
            : []

        const remoteSchedules = rawList.map((item) => ({
          ...item,
          pdf: normalizePdfUrl(item.pdf),
        }))
        if (active) {
          setSchedules(remoteSchedules)
        }
      } catch (fetchError) {
        if (!isNetworkFailure(fetchError)) {
          console.warn("ScheduleListShell fetch:", fetchError)
        }
        if (active) {
          setError(
            isNetworkFailure(fetchError)
              ? apiUnreachableMessage(apiBase, isArabic)
              : isArabic
                ? "فشل تحميل الجداول من الخادم."
                : "Failed to load schedules from the server."
          )
          setSchedules([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchSchedules()
    return () => {
      active = false
    }
  }, [apiBase, backendAudience, isArabic, normalizePdfUrl])

  const deleteSchedule = useCallback(
    async (item: ScheduleItem) => {
      setDeletingId(item.id)
      try {
        const token = getAccessToken()
        const res = await fetch(`${apiBase}/api/documents/${item.id}/`, {
          method: "DELETE",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })
        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(text || res.statusText)
        }
        setError(null)
        setSchedules((prev) => prev.filter((s) => s.id !== item.id))
      } catch (e) {
        console.warn("Delete schedule:", e)
        setError(
          isArabic
            ? "تعذر حذف الجدول. تحقق من صلاحياتك أو حاول لاحقاً."
            : "Could not delete this schedule. Check your permissions or try again."
        )
      } finally {
        setDeletingId(null)
      }
    },
    [apiBase, isArabic]
  )

  const filteredSchedules = useMemo(() => {
    const q = search.trim().toLowerCase()
    const items = schedules.filter((item) => {
      const formattedDate = new Date(item.uploaded_at).toLocaleDateString("fr-FR").toLowerCase()
      const matchesSearch =
        q.length === 0 ||
        item.title.toLowerCase().includes(q) ||
        formattedDate.includes(q)
      if (!matchesSearch) return false

      if (gradeFilter === "all") return true
      return extractGrade(item.title) === gradeFilter
    })

    return [...items].sort(
      (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )
  }, [gradeFilter, schedules, search])

  const filteredCount = filteredSchedules.length
  const scheduleTotalPages = Math.max(1, Math.ceil(filteredCount / SCHEDULE_PAGE_SIZE))
  const safeGridPage = Math.min(gridPage, scheduleTotalPages - 1)
  const visibleSchedules = useMemo(
    () =>
      filteredSchedules.slice(
        safeGridPage * SCHEDULE_PAGE_SIZE,
        safeGridPage * SCHEDULE_PAGE_SIZE + SCHEDULE_PAGE_SIZE
      ),
    [filteredSchedules, safeGridPage]
  )
  const showScheduleCarousel = !error && filteredCount > SCHEDULE_PAGE_SIZE
  const carouselPrevDisabled = safeGridPage <= 0
  const carouselNextDisabled = safeGridPage >= scheduleTotalPages - 1

  useEffect(() => {
    setGridPage(0)
  }, [search, gradeFilter])

  useEffect(() => {
    setGridPage((p) => Math.min(p, Math.max(0, scheduleTotalPages - 1)))
  }, [scheduleTotalPages])

  const primarySchedule = useMemo(() => {
    if (schedules.length === 0) return null
    return [...schedules].sort(
      (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )[0]
  }, [schedules])

  /** Ensures we only toast once per mount when the student timetable appears. */
  const timetableNotifiedRef = useRef(false)

  useEffect(() => {
    if (audience !== "student" || loading || error || !primarySchedule) return
    if (timetableNotifiedRef.current) return
    timetableNotifiedRef.current = true
    void notifyUser({
      title: isArabic ? "جدولك جاهز" : "Your timetable is ready",
      body: primarySchedule.title,
      tag: "student-timetable-ready",
    })
  }, [audience, loading, error, primarySchedule, isArabic])

  if (layout === "single") {
    return (
      <section className="mt-4 flex w-full min-w-0 max-w-none flex-1 flex-col self-stretch">
        {loading && <ScheduleSingleSkeleton />}

        {!loading && error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!loading && primarySchedule && (
          <PdfPreview
            url={primarySchedule.pdf}
            title={primarySchedule.title}
            date={new Date(primarySchedule.uploaded_at).toLocaleDateString("fr-FR")}
            professor={
              primarySchedule.audience === "teacher" || primarySchedule.audience === "professor"
                ? primarySchedule.title
                : isArabic
                  ? "غير متوفر"
                  : "N/A"
            }
          />
        )}

        {!loading && !error && !primarySchedule && (
          <p className="text-sm text-muted-foreground">
            {isArabic
              ? "لا يوجد جدول منشور بعد."
              : "No timetable has been published yet."}
          </p>
        )}
      </section>
    )
  }

  const listEmptyMessage =
    schedules.length === 0
      ? isArabic
        ? "لا توجد جداول منشورة بعد."
        : "No schedules have been published yet."
      : isArabic
        ? "لا توجد نتائج مطابقة."
        : "No matching schedules found."

  return (
    <section className="mt-4 flex min-h-[calc(100dvh-7.5rem)] w-full min-w-0 max-w-none flex-1 flex-col space-y-4 self-stretch">
      <div className="flex w-full max-w-none flex-wrap items-center justify-between gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(backHref)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border-border bg-card px-3 text-sm text-foreground hover:bg-accent"
          aria-label={backLabel}
        >
          <MoveLeft size={18} />
          <span className="hidden sm:inline">{backLabel}</span>
        </Button>
        <h1 className="text-sm font-semibold font-montserrat text-foreground sm:text-xl xl:text-2xl ">{title}</h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(nextHref)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border-border bg-card px-3 text-sm text-foreground hover:bg-accent"
          aria-label={nextLabel}
        >
          <span className="hidden sm:inline">{nextLabel}</span>
          <MoveRight size={18} />
        </Button>
      </div>

      <div className="flex w-full min-w-0 max-w-none flex-1 flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-[#F6F9FB] p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-fit w-fit items-center justify-center rounded-sm border border-blue-primary bg-slate-50">
              <Users className="text-[#1B2065]" size={20} aria-hidden />
            </div>
            <div>
              <p className="text-base font-bold text-[#1B2065]">
                {isArabic ? "قائمة الجداول" : "Schedule list"}
              </p>
              <p className="text-xs text-muted-foreground">
                {loading
                  ? isArabic
                    ? "…"
                    : "…"
                  : isArabic
                    ? `${filteredSchedules.length} عنصر`
                    : `${filteredSchedules.length} items`}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:max-w-2xl ">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={isArabic ? "بحث..." : "Search..."}
              inputClassName="rounded-xl border border-slate-200 bg-[#FEF9F9] shadow-sm"
            />
            <div className="relative w-full sm:min-w-[10.5rem]">
              <Funnel
                className="pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
                size={16}
                aria-hidden
              />
              <Select
                value={gradeFilter === "all" ? undefined : gradeFilter}
                onValueChange={(v) => setGradeFilter(v as GradeFilter)}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-[#FEF9F9] ps-9 pe-2 text-sm font-medium text-[#1B2065] shadow-sm">
                  <SelectValue
                    placeholder={isArabic ? "تصفية" : "Filter"}
                  />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  align="start"
                  sideOffset={6}
                  className="min-w-[var(--radix-select-trigger-width)]"
                >
                  <SelectGroup>
                    <SelectLabel className="px-2 font-semibold text-[#1B2065]">
                      {isArabic ? "تصفية" : "Filter"}
                    </SelectLabel>
                    <SelectItem value="all">
                      {isArabic ? "كل المستويات" : "All levels"}
                    </SelectItem>
                    <SelectItem value="1CP">1CP</SelectItem>
                    <SelectItem value="2CP">2CP</SelectItem>
                    <SelectItem value="1CS">1CS</SelectItem>
                    <SelectItem value="2CS">2CS</SelectItem>
                    <SelectItem value="3CS">3CS</SelectItem>
                    <SelectItem value="DOCTORATE">
                      {isArabic ? "دكتوراه" : "Doctorate"}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading && <ScheduleGridSkeleton cards={6} />}

        {!loading ? (
          <div
            className={showScheduleCarousel ? "relative px-2 sm:px-12" : "relative"}
          >
            {showScheduleCarousel ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={isArabic ? "الصفحة السابقة" : "Previous schedules"}
                  className={`${carouselArrowClass} start-0 sm:start-1`}
                  disabled={carouselPrevDisabled}
                  onClick={() => setGridPage((p) => Math.max(0, p - 1))}
                >
                  {dir === "rtl" ? (
                    <ChevronRight className="size-6 text-inherit" aria-hidden />
                  ) : (
                    <ChevronLeft className="size-6 text-inherit" aria-hidden />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={isArabic ? "الصفحة التالية" : "Next schedules"}
                  className={`${carouselArrowClass} end-0 sm:end-1`}
                  disabled={carouselNextDisabled}
                  onClick={() =>
                    setGridPage((p) => Math.min(scheduleTotalPages - 1, p + 1))
                  }
                >
                  {dir === "rtl" ? (
                    <ChevronLeft className="size-6 text-inherit" aria-hidden />
                  ) : (
                    <ChevronRight className="size-6 text-inherit" aria-hidden />
                  )}
                </Button>
              </>
            ) : null}
            <div className={scheduleCardGridClass}>
              {error ? (
                <div className="col-span-full flex min-h-[12rem] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-4 py-10 text-center">
                  <p className="text-sm font-medium text-destructive">{error}</p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic
                      ? "تحقق من الاتصال أو حاول لاحقاً."
                      : "Check your connection or try again later."}
                  </p>
                </div>
              ) : null}
              {!error && filteredSchedules.length === 0 ? (
                <div className="col-span-full flex min-h-[12rem] w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-muted-foreground">
                  {listEmptyMessage}
                </div>
              ) : null}
              {!error &&
                visibleSchedules.map((schedule) => (
                  <div key={schedule.id} className="min-w-0">
                    <PdfPreview
                      url={schedule.pdf}
                      title={schedule.title}
                      date={new Date(schedule.uploaded_at).toLocaleDateString("fr-FR")}
                      professor={
                        schedule.audience === "teacher" ||
                        schedule.audience === "professor"
                          ? schedule.title
                          : isArabic
                            ? "غير متوفر"
                            : "N/A"
                      }
                      onDelete={
                        allowDelete ? () => void deleteSchedule(schedule) : undefined
                      }
                      deletePending={allowDelete && deletingId === schedule.id}
                    />
                  </div>
                ))}
            </div>
          </div>
        ) : null}

      </div>
    </section>
  )
}
