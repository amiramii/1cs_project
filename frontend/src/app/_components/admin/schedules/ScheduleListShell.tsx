"use client"

/**
 * Shared shell for schedule PDF lists (professor list vs student single-PDF view).
 * When `layout="single"` (typical student timetable page), we fire a one-time
 * desktop notification after the latest PDF is resolved so learners know they can
 * scroll without staring at the loading state.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Funnel, MoveLeft, MoveRight, Users } from "lucide-react"
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

type GradeFilter = "all" | "1CP" | "2CP" | "1CS" | "2CS" | "5CS"

const extractGrade = (title: string): Exclude<GradeFilter, "all"> | null => {
  const normalized = title.toUpperCase().replace(/\s+/g, "")
  if (normalized.includes("1CP")) return "1CP"
  if (normalized.includes("2CP")) return "2CP"
  if (normalized.includes("1CS")) return "1CS"
  if (normalized.includes("2CS")) return "2CS"
  if (normalized.includes("5CS")) return "5CS"
  return null
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
}: ScheduleListShellProps) {
  const [search, setSearch] = useState("")
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all")
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { language } = useLanguage()
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

  const primarySchedule = useMemo(() => {
    if (schedules.length === 0) return null
    return [...schedules].sort(
      (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    )[0]
  }, [schedules])

  /** Ensures we only toast once per mount when the student timetable appears. */
  const timetableNotifiedRef = useRef(false)

  useEffect(() => {
    if (layout !== "single" || loading || error || !primarySchedule) return
    if (timetableNotifiedRef.current) return
    timetableNotifiedRef.current = true
    void notifyUser({
      title: isArabic ? "جدولك جاهز" : "Your timetable is ready",
      body: primarySchedule.title,
      tag: "student-timetable-ready",
    })
  }, [layout, loading, error, primarySchedule, isArabic])

  if (layout === "single") {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col">
        {loading && (
          <p className="text-sm text-muted-foreground">
            {isArabic ? "جارٍ تحميل الجدول..." : "Loading your schedule..."}
          </p>
        )}

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

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-7.5rem)] w-full max-w-[96rem] flex-col space-y-4 px-2 sm:px-3 md:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
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
        <h1 className="text-sm font-semibold text-foreground sm:text-xl">{title}</h1>
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

      <div className="flex flex-1 flex-col rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background">
              <Users className="text-primary" size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isArabic ? "قائمة الجداول" : "Schedule List"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isArabic
                  ? `${filteredSchedules.length} عنصر`
                  : `${filteredSchedules.length} items`}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={isArabic ? "ابحث بالعنوان أو التاريخ..." : "Search by title or date..."}
            />
            <div className="relative w-full sm:min-w-40">
              <Funnel
                className="pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
                size={16}
                aria-hidden
              />
              <Select
                value={gradeFilter}
                onValueChange={(v) => setGradeFilter(v as GradeFilter)}
              >
                <SelectTrigger className="h-10 w-full rounded-2xl border border-border bg-background ps-8 pe-2 text-sm text-foreground shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {isArabic ? "كل المستويات" : "All grades"}
                  </SelectItem>
                  <SelectItem value="1CP">1CP</SelectItem>
                  <SelectItem value="2CP">2CP</SelectItem>
                  <SelectItem value="1CS">1CS</SelectItem>
                  <SelectItem value="2CS">2CS</SelectItem>
                  <SelectItem value="5CS">5CS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading && (
          <p className="mt-4 text-sm text-muted-foreground">
            {isArabic ? "جارٍ تحميل الجداول..." : "Loading schedules..."}
          </p>
        )}

        {!loading && error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}

        {!loading && !error && (
          <div className="mt-4 grid w-full grid-cols-1 gap-4 pb-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSchedules.map((schedule) => (
              <div key={schedule.id} className="w-full">
                <PdfPreview
                  url={schedule.pdf}
                  title={schedule.title}
                  date={new Date(schedule.uploaded_at).toLocaleDateString("fr-FR")}
                  professor={
                    schedule.audience === "teacher" || schedule.audience === "professor"
                      ? schedule.title
                      : isArabic
                        ? "غير متوفر"
                        : "N/A"
                  }
                />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filteredSchedules.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {isArabic ? "لا توجد نتائج مطابقة." : "No matching schedules found."}
          </p>
        )}

      </div>
    </section>
  )
}
