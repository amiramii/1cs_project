"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Trash2,
  ArrowDownToLine,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Funnel,
  MoveLeft,
  MoveRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import SearchBar from "../SearchBar"
import { useLanguage } from "@/app/_components/language-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
import { SCHEDULE_LIST_EMPTY_CLASS } from "@/lib/scheduleUiClasses"
import {
  loadAllAcademicYears,
  loadAllExcelSchedules,
  deleteExcelSchedule,
  type ExcelScheduleRow,
} from "@/lib/checkinClient"
import { getScheduleFileFetchUrl } from "@/lib/scheduleMediaUrl"
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole"
import { apiUnreachableMessage, isNetworkFailure } from "@/lib/fetchErrors"
import { getApiBaseUrl } from "@/lib/apiBase"

type YearFilter = "all" | "1CP" | "2CP" | "1CS" | "2CS" | "3CS" | "DOCTORATE"

const EXCEL_PAGE_SIZE = 6

const YEAR_FILTER_OPTIONS: Array<{ value: YearFilter; labelEn: string; labelAr: string }> = [
  { value: "all", labelEn: "All years", labelAr: "كل السنوات" },
  { value: "1CP", labelEn: "1CP", labelAr: "1CP" },
  { value: "2CP", labelEn: "2CP", labelAr: "2CP" },
  { value: "1CS", labelEn: "1CS", labelAr: "1CS" },
  { value: "2CS", labelEn: "2CS", labelAr: "2CS" },
  { value: "3CS", labelEn: "3CS", labelAr: "3CS" },
  { value: "DOCTORATE", labelEn: "Doctorate", labelAr: "دكتوراه" },
]

function normalizeYearToFilter(
  raw: string | null | undefined
): Exclude<YearFilter, "all"> | null {
  if (!raw?.trim()) return null
  const n = raw.toUpperCase().replace(/\s+/g, "")
  if (n.includes("1CP")) return "1CP"
  if (n.includes("2CP")) return "2CP"
  if (n.includes("3CS") || n.includes("5CS")) return "3CS"
  if (n.includes("2CS")) return "2CS"
  if (n.includes("1CS")) return "1CS"
  if (n.includes("DOCTOR")) return "DOCTORATE"
  return null
}

function resolveExcelYearFilter(
  item: ExcelScheduleRow,
  yearMap: Map<number, string>
): Exclude<YearFilter, "all"> | null {
  const y = item.year
  if (y != null) {
    if (typeof y === "object" && "name" in y) {
      return normalizeYearToFilter(y.name)
    }
    if (typeof y === "number") {
      return normalizeYearToFilter(yearMap.get(y))
    }
  }
  return normalizeYearToFilter(item.title)
}

function ExcelGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div
      className="mt-4 grid min-h-[8rem] w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-4"
      role="status"
      aria-busy="true"
      aria-label="Loading Excel files"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#383F58] dark:bg-[#1A2036]"
        >
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
          <Skeleton className="mt-4 h-9 w-full" />
        </div>
      ))}
    </div>
  )
}

export default function ExcelScheduleList() {
  const router = useRouter()
  const { language, dir } = useLanguage()
  const isArabic = language === "ar"
  const appRole = useEffectiveAppRole()
  const allowDelete = appRole === "admin"
  const [items, setItems] = useState<ExcelScheduleRow[]>([])
  const [yearMap, setYearMap] = useState<Map<number, string>>(new Map())
  const [search, setSearch] = useState("")
  const [yearFilter, setYearFilter] = useState<YearFilter>("all")
  const [gridPage, setGridPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rows, years] = await Promise.all([
        loadAllExcelSchedules(),
        loadAllAcademicYears().catch(() => [] as Array<{ id: number; name: string }>),
      ])
      setYearMap(new Map(years.map((y) => [y.id, y.name])))
      setItems(
        rows.map((row) => ({
          ...row,
          file: getScheduleFileFetchUrl(row.file),
        }))
      )
    } catch (err) {
      setError(
        isNetworkFailure(err)
          ? apiUnreachableMessage(getApiBaseUrl(), isArabic)
          : isArabic
            ? "تعذر تحميل ملفات Excel."
            : "Could not load Excel files."
      )
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [isArabic])

  useEffect(() => {
    void load()
  }, [load])

  const deleteExcelItem = useCallback(
    async (item: ExcelScheduleRow) => {
      if (!allowDelete) return
      const confirmed = window.confirm(
        isArabic
          ? `حذف «${item.title}»؟`
          : `Delete «${item.title}»?`
      )
      if (!confirmed) return
      setDeletingId(item.id)
      try {
        const res = await deleteExcelSchedule(item.id)
        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(text || res.statusText)
        }
        setError(null)
        setItems((prev) => prev.filter((row) => row.id !== item.id))
      } catch (e) {
        setError(
          isNetworkFailure(e)
            ? apiUnreachableMessage(getApiBaseUrl(), isArabic)
            : isArabic
              ? "تعذر حذف الملف."
              : "Could not delete this file."
        )
      } finally {
        setDeletingId(null)
      }
    },
    [allowDelete, isArabic]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...items]
      .filter((item) => {
        const formattedDate = item.uploaded_at
          ? new Date(item.uploaded_at).toLocaleDateString("fr-FR").toLowerCase()
          : ""
        const semester = item.semester?.toLowerCase() ?? ""
        const matchesSearch =
          q.length === 0 ||
          item.title.toLowerCase().includes(q) ||
          semester.includes(q) ||
          formattedDate.includes(q)
        if (!matchesSearch) return false
        if (yearFilter === "all") return true
        return resolveExcelYearFilter(item, yearMap) === yearFilter
      })
      .sort((a, b) =>
        String(b.uploaded_at ?? "").localeCompare(String(a.uploaded_at ?? ""))
      )
  }, [items, search, yearFilter, yearMap])

  const filteredCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(filteredCount / EXCEL_PAGE_SIZE))
  const safePage = Math.min(gridPage, totalPages - 1)
  const visible = useMemo(
    () =>
      filtered.slice(
        safePage * EXCEL_PAGE_SIZE,
        safePage * EXCEL_PAGE_SIZE + EXCEL_PAGE_SIZE
      ),
    [filtered, safePage]
  )
  const showCarousel = !error && filteredCount > EXCEL_PAGE_SIZE
  const carouselPrevDisabled = safePage <= 0
  const carouselNextDisabled = safePage >= totalPages - 1

  useEffect(() => {
    setGridPage(0)
  }, [search, yearFilter])

  useEffect(() => {
    setGridPage((p) => Math.min(p, Math.max(0, totalPages - 1)))
  }, [totalPages])

  const listEmptyMessage =
    items.length === 0
      ? isArabic
        ? "لا توجد ملفات Excel."
        : "No Excel files found."
      : isArabic
        ? "لا توجد نتائج مطابقة."
        : "No matching files found."

  const carouselArrowClass =
    "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#1B2065]/85 text-white shadow-md transition-colors hover:!bg-[#1B2065] hover:!text-white focus-visible:!bg-[#1B2065] focus-visible:!text-white [&_svg]:shrink-0 [&_svg]:text-inherit disabled:pointer-events-none disabled:opacity-35"

  return (
    <section className="mt-4 flex min-h-[calc(100dvh-7.5rem)] w-full min-w-0 max-w-full flex-1 flex-col space-y-4 self-stretch">
      <div className="flex w-full max-w-full flex-wrap items-center justify-between gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/Scheduals/Student-Schedules")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border-border bg-card px-3 text-sm text-foreground hover:bg-accent"
          aria-label={isArabic ? "الطلاب" : "Students"}
        >
          {dir === "rtl" ? <MoveRight size={18} /> : <MoveLeft size={18} />}
          <span className="hidden sm:inline">
            {isArabic ? "الطلاب" : "Students"}
          </span>
        </Button>
        <h1 className="min-w-0 flex-1 text-center font-montserrat text-sm font-semibold text-foreground sm:text-xl xl:text-2xl">
          {isArabic ? "ملفات Excel" : "Excel Files"}
        </h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/Scheduals")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border-border bg-card px-3 text-sm text-foreground hover:bg-accent"
          aria-label={isArabic ? "العودة للتحميل" : "Back to Upload"}
        >
          <span className="hidden sm:inline">
            {isArabic ? "العودة للتحميل" : "Back to Upload"}
          </span>
          {dir === "rtl" ? <MoveLeft size={18} /> : <MoveRight size={18} />}
        </Button>
      </div>

      <div className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-6 bg-transparent">
        <div className="flex w-full min-w-0 flex-col gap-4 rounded-xl border border-blue-primary/50 bg-[#F6F9FB] p-3 text-start shadow-md lg:flex-row lg:items-center lg:justify-between dark:border-[#74A7BD]/25 dark:bg-[#1A2036]">
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <div className="flex h-fit w-fit shrink-0 items-center justify-center rounded-sm border border-blue-primary bg-slate-50 dark:border-[#383F58] dark:bg-[#242A40]">
              <FileSpreadsheet
                className="text-[#1B2065] dark:text-[#EEF4F7]"
                size={20}
                aria-hidden
              />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-[#1B2065] dark:text-[#EEF4F7]">
                {isArabic ? "قائمة ملفات Excel" : "Excel files list"}
              </p>
              <p className="text-xs text-muted-foreground">
                {loading
                  ? isArabic
                    ? "…"
                    : "…"
                  : isArabic
                    ? `${filteredCount} عنصر`
                    : `${filteredCount} items`}
              </p>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:shrink-0">
            <div className="w-full min-w-0 shrink-0 sm:max-w-xs md:max-w-sm">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder={isArabic ? "بحث..." : "Search..."}
                inputClassName="rounded-xl border border-slate-200/80 bg-[#FEF9F9] shadow-sm dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#EEF4F7] dark:placeholder:text-[#9BA8C4]"
              />
            </div>
            <div className="relative w-full shrink-0 sm:w-32 md:w-36">
              <Funnel
                className="pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
                size={16}
                aria-hidden
              />
              <Select
                value={yearFilter === "all" ? undefined : yearFilter}
                onValueChange={(v) => setYearFilter(v as YearFilter)}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200/80 bg-[#FEF9F9] ps-9 pe-2 text-sm font-medium text-[#1B2065] shadow-sm dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#EEF4F7]">
                  <SelectValue placeholder={isArabic ? "السنة" : "Year"} />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  align="start"
                  sideOffset={6}
                  className="min-w-[var(--radix-select-trigger-width)] border border-slate-200/40 bg-popover/75 shadow-lg backdrop-blur-xl dark:border-border/50 dark:bg-popover/70"
                >
                  <SelectGroup>
                    <SelectLabel className="px-2 font-semibold text-[#1B2065]">
                      {isArabic ? "السنة" : "Year"}
                    </SelectLabel>
                    {YEAR_FILTER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {isArabic ? opt.labelAr : opt.labelEn}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? <ExcelGridSkeleton cards={6} /> : null}

        {!loading ? (
          <div
            className={
              showCarousel
                ? "relative min-w-0 max-w-full px-2 sm:px-12 md:px-14"
                : "relative min-w-0 max-w-full"
            }
          >
            {showCarousel ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={isArabic ? "الصفحة السابقة" : "Previous page"}
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
                  aria-label={isArabic ? "الصفحة التالية" : "Next page"}
                  className={`${carouselArrowClass} end-0 sm:end-1`}
                  disabled={carouselNextDisabled}
                  onClick={() =>
                    setGridPage((p) => Math.min(totalPages - 1, p + 1))
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

            <div className="mt-4 grid min-h-[8rem] w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-4">
              {error ? (
                <div className="col-span-full flex min-h-[12rem] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-4 py-10 text-center">
                  <p className="text-sm font-medium text-destructive">{error}</p>
                </div>
              ) : null}
              {!error && filteredCount === 0 ? (
                <div className={cn("col-span-full", SCHEDULE_LIST_EMPTY_CLASS)}>
                  {listEmptyMessage}
                </div>
              ) : null}
              {!error &&
                visible.map((item) => {
                  const yearLabel = resolveExcelYearFilter(item, yearMap)
                  const yearDisplay =
                    yearLabel &&
                    YEAR_FILTER_OPTIONS.find((o) => o.value === yearLabel)
                  return (
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
                            {item.title}
                          </h2>
                          <p className="mt-0.5 text-xs font-medium text-[#51689A] dark:text-[#9BA8C4]">
                            {item.semester}
                            {yearDisplay
                              ? ` · ${isArabic ? yearDisplay.labelAr : yearDisplay.labelEn}`
                              : null}
                          </p>
                          <p className="mt-1 text-xs text-[#51689A] dark:text-[#9BA8C4]">
                            {item.uploaded_at
                              ? new Date(item.uploaded_at).toLocaleString()
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                        <Button
                          asChild
                          className="w-full bg-[#51689A] text-white hover:bg-[#40547F]"
                        >
                          <a
                            href={item.file}
                            target="_blank"
                            rel="noreferrer"
                            download
                          >
                            <ArrowDownToLine className="me-2 size-4" />
                            {isArabic ? "تحميل" : "Download"}
                          </a>
                        </Button>
                        {allowDelete ? (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={deletingId === item.id}
                            onClick={() => void deleteExcelItem(item)}
                            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="me-2 size-4" />
                            {deletingId === item.id
                              ? isArabic
                                ? "جارٍ الحذف…"
                                : "Deleting…"
                              : isArabic
                                ? "حذف"
                                : "Delete"}
                          </Button>
                        ) : null}
                      </div>
                    </article>
                  )
                })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
