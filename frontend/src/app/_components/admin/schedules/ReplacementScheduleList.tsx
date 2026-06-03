"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowDownToLine,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
  Funnel,
  MoveLeft,
  MoveRight,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { SCHEDULE_LIST_EMPTY_CLASS } from "@/lib/scheduleUiClasses"
import PdfPreview from "./PdfPreview"
import {
  loadReplacementSchedulesMerged,
  removeReplacementScheduleCache,
  type ReplacementScheduleCacheRow,
} from "@/lib/replacementScheduleCache"
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole"

type YearFilter = "all" | "1CP" | "2CP" | "1CS" | "2CS" | "3CS" | "DOCTORATE"

const PAGE_SIZE = 6
const navy = "#1B2065"

const YEAR_FILTER_OPTIONS: Array<{ value: YearFilter; labelEn: string; labelAr: string }> = [
  { value: "all", labelEn: "All years", labelAr: "كل السنوات" },
  { value: "1CP", labelEn: "1CP", labelAr: "1CP" },
  { value: "2CP", labelEn: "2CP", labelAr: "2CP" },
  { value: "1CS", labelEn: "1CS", labelAr: "1CS" },
  { value: "2CS", labelEn: "2CS", labelAr: "2CS" },
  { value: "3CS", labelEn: "3CS", labelAr: "3CS" },
  { value: "DOCTORATE", labelEn: "Doctorate", labelAr: "دكتوراه" },
]

function normalizeYearToFilter(raw: string | null | undefined): Exclude<YearFilter, "all"> | null {
  if (!raw?.trim()) return null
  const n = raw.toUpperCase().replace(/\s+/g, "")
  if (n.includes("1CP") || n === "1") return "1CP"
  if (n.includes("2CP") || n === "2") return "2CP"
  if (n.includes("3CS") || n.includes("5CS") || n === "5") return "3CS"
  if (n.includes("2CS") || n === "4") return "2CS"
  if (n.includes("1CS") || n === "3") return "1CS"
  if (n.includes("DOCTOR")) return "DOCTORATE"
  return null
}

export default function ReplacementScheduleList() {
  const router = useRouter()
  const { language, dir } = useLanguage()
  const isArabic = language === "ar"
  const appRole = useEffectiveAppRole()
  const allowDelete = appRole === "admin"
  const [items, setItems] = useState<ReplacementScheduleCacheRow[]>([])
  const [search, setSearch] = useState("")
  const [yearFilter, setYearFilter] = useState<YearFilter>("all")
  const [gridPage, setGridPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<ReplacementScheduleCacheRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await loadReplacementSchedulesMerged()
      setItems(rows)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      const matchesSearch =
        q.length === 0 ||
        item.title.toLowerCase().includes(q) ||
        item.year.toLowerCase().includes(q)
      if (!matchesSearch) return false
      if (yearFilter === "all") return true
      return normalizeYearToFilter(item.year) === yearFilter
    })
  }, [items, search, yearFilter])

  const filteredCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))
  const safePage = Math.min(gridPage, totalPages - 1)
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
  const showCarousel = filteredCount > PAGE_SIZE

  useEffect(() => {
    setGridPage(0)
  }, [search, yearFilter])

  useEffect(() => {
    setGridPage((p) => Math.min(p, Math.max(0, totalPages - 1)))
  }, [totalPages])

  const deleteItem = useCallback(
    async (item: ReplacementScheduleCacheRow) => {
      if (!allowDelete) return
      setDeletingId(item.id)
      try {
        if (!item.id.startsWith("notif-")) {
          removeReplacementScheduleCache(item.id)
        }
        setItems((prev) => prev.filter((row) => row.id !== item.id))
      } finally {
        setDeletingId(null)
      }
    },
    [allowDelete]
  )

  const isStudentRole = appRole === "student"

  const carouselArrowClass =
    "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#1B2065]/85 text-white shadow-md transition-colors hover:!bg-[#1B2065] hover:!text-white focus-visible:!bg-[#1B2065] focus-visible:!text-white [&_svg]:shrink-0 [&_svg]:text-inherit disabled:pointer-events-none disabled:opacity-35"

  return (
    <section className="mt-4 flex min-h-[calc(100dvh-7.5rem)] w-full min-w-0 max-w-full flex-1 flex-col space-y-4 self-stretch">
      <div className="flex w-full max-w-full flex-wrap items-center justify-between gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(isStudentRole ? "/Scheduals" : "/Scheduals/Student-Schedules")
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border-border bg-card px-3 text-sm text-foreground hover:bg-accent"
        >
          {dir === "rtl" ? <MoveRight size={18} /> : <MoveLeft size={18} />}
          <span className="hidden sm:inline">
            {isStudentRole
              ? isArabic
                ? "جداولي"
                : "My schedules"
              : isArabic
                ? "الطلاب"
                : "Students"}
          </span>
        </Button>
        <h1 className="min-w-0 flex-1 text-center font-montserrat text-sm font-semibold text-foreground sm:text-xl xl:text-2xl">
          {isStudentRole
            ? isArabic
              ? "جداول Remplacement"
              : "Replacement Schedules"
            : isArabic
              ? "جداول Remplacement"
              : "Replacement Schedules"}
        </h1>
        {!isStudentRole ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/Scheduals/Excel-Schedules")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border-border bg-card px-3 text-sm text-foreground hover:bg-accent"
          >
            <span className="hidden sm:inline">{isArabic ? "Excel" : "Excel"}</span>
            {dir === "rtl" ? <MoveLeft size={18} /> : <MoveRight size={18} />}
          </Button>
        ) : (
          <div className="h-10 w-[4.5rem] shrink-0 sm:w-24" aria-hidden />
        )}
      </div>

      <div className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-6 bg-transparent">
        <div className="flex w-full min-w-0 flex-col gap-4 rounded-xl border border-blue-primary/50 bg-[#F6F9FB] p-3 text-start shadow-md lg:flex-row lg:items-center lg:justify-between dark:border-[#74A7BD]/25 dark:bg-[#1A2036]">
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <div className="flex h-fit w-fit shrink-0 items-center justify-center rounded-sm border border-blue-primary bg-slate-50 dark:border-[#383F58] dark:bg-[#242A40]">
              <FileText className="text-[#1B2065] dark:text-[#EEF4F7]" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-[#1B2065] dark:text-[#EEF4F7]">
                {isArabic ? "قائمة ملفات Remplacement" : "Replacement files list"}
              </p>
              <p className="text-xs text-muted-foreground">
                {loading ? "…" : isArabic ? `${filteredCount} عنصر` : `${filteredCount} items`}
              </p>
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:shrink-0">
            <div className="w-full min-w-0 shrink-0 sm:max-w-xs md:max-w-sm">
              <SearchBar value={search} onChange={setSearch} placeholder={isArabic ? "بحث..." : "Search..."} />
            </div>
            <div className="relative w-full shrink-0 sm:w-32 md:w-36">
              <Funnel className="pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground" size={16} />
              <Select
                value={yearFilter === "all" ? undefined : yearFilter}
                onValueChange={(v) => setYearFilter(v as YearFilter)}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200/80 bg-[#FEF9F9] ps-9 pe-2 text-sm font-medium text-[#1B2065] shadow-sm dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#EEF4F7]">
                  <SelectValue placeholder={isArabic ? "السنة" : "Year"} />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" sideOffset={6}>
                  <SelectGroup>
                    <SelectLabel>{isArabic ? "السنة" : "Year"}</SelectLabel>
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

        {loading ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
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
              {filteredCount === 0 ? (
                <div className={cn("col-span-full", SCHEDULE_LIST_EMPTY_CLASS)}>
                  {isArabic
                    ? isStudentRole
                      ? "لا توجد جداول Remplacement مرسلة إليك بعد."
                      : "لا توجد ملفات Remplacement محفوظة بعد. ارفع ملفًا من صفحة الإضافة."
                    : isStudentRole
                      ? "No replacement schedules have been sent to you yet."
                      : "No replacement files saved yet. Upload one from the Add schedule page."}
                </div>
              ) : (
                visible.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-[#51689A]/25 bg-[#FEF9F9] p-4 shadow-sm dark:border-[#383F58] dark:bg-[#1A2036]"
                  >
                    <PdfPreview
                      url={item.file}
                      title={item.title}
                      date={new Date(item.uploaded_at).toLocaleDateString("fr-FR")}
                      professor={item.year}
                    />
                    <div className="mt-3 flex flex-col gap-2">
                      <Button asChild className="w-full bg-[#51689A] text-white hover:bg-[#40547F]">
                        <a href={item.file} target="_blank" rel="noreferrer" download>
                          <ArrowDownToLine className="me-2 size-4" />
                          {isArabic ? "تحميل" : "Download"}
                        </a>
                      </Button>
                      {allowDelete ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={deletingId === item.id}
                          onClick={() => {
                            setPendingDeleteItem(item)
                            setDeleteConfirmOpen(true)
                          }}
                          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="me-2 size-4" />
                          {isArabic ? "حذف" : "Delete"}
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md border-slate-200 bg-card/80 shadow-lg backdrop-blur-3xl" showCloseButton>
          <DialogHeader className="space-y-2 text-center sm:text-center">
            <DialogTitle className="text-lg font-bold sm:text-xl" style={{ color: navy }}>
              {isArabic ? "تأكيد حذف هذا الجدول" : "Confirm deleting this schedule"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isArabic ? "سيُزال الجدول من هذه القائمة." : "This schedule will be removed from the list."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-center sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-lg border-2 border-[#1B2065] font-semibold text-[#1B2065]"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setPendingDeleteItem(null)
              }}
            >
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="button"
              disabled={deletingId != null}
              className="h-11 flex-1 rounded-lg border-0 font-semibold text-white"
              style={{ backgroundColor: navy }}
              onClick={() => {
                if (pendingDeleteItem) void deleteItem(pendingDeleteItem)
                setDeleteConfirmOpen(false)
                setPendingDeleteItem(null)
              }}
            >
              {isArabic ? "تأكيد" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
