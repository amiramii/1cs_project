"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Funnel,
  Pencil,
  Search,
  Trash2,
  Users,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useLanguage } from "@/app/_components/language-provider"
import { getAccessToken } from "@/lib/tokenStorage"
import { getApiBaseUrl } from "@/lib/apiBase"
import { checkinPath } from "@/lib/checkinApi"
import { loadDrfListAll } from "@/lib/drfPaginatedList"
import { deleteUserById, loadAllAcademicSections } from "@/lib/checkinClient"

type JustifiedSemester = {
  id: string
  labelEn: string
  labelAr: string
  count: number
  max: number
}

type StudentRow = {
  id: string
  name: string
  email: string
  year: string
  section: string
  group: string
  justifiedSemesters: JustifiedSemester[]
}

type ApiStudentRow = {
  user_id: string | number
  full_name: string
  email: string
  year: number
  section: number
  group: number
}

const controlBtnClass =
  "h-[43px] min-h-[43px] shrink-0 rounded-lg border border-[#51689A]/35 bg-white px-2.5 text-[#1B2065F2] shadow-sm hover:bg-[#FDFDFF] sm:h-9 sm:min-h-0"

const PAGE_SIZE = 5

function collectYears(rows: StudentRow[]) {
  return Array.from(new Set(rows.map((r) => r.year))).sort()
}

export default function StudTable() {
  const { language } = useLanguage()
  const isArabic = language === "ar"
  const [data, setData] = useState<StudentRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [openFilter, setOpenFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const mapStudents = useCallback(
    (
      raw: ApiStudentRow[],
      yMap: Map<number, string>,
      secMap: Map<number, string>,
      gMap: Map<number, string>
    ): StudentRow[] => {
      return raw.map((s) => ({
        id: String(s.user_id),
        name: s.full_name,
        email: s.email,
        year: yMap.get(s.year) ?? "—",
        section: secMap.get(s.section) ?? "—",
        group: gMap.get(s.group) ?? "—",
        justifiedSemesters: [],
      }))
    },
    []
  )

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const token = getAccessToken()
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    }
    const base = getApiBaseUrl()
    try {
      const [rawStudents, years, sections, groups] = await Promise.all([
        loadDrfListAll<ApiStudentRow>(base, `${checkinPath.students}/`, headers, {}),
        loadDrfListAll<{ id: number; name: string }>(
          base,
          `${checkinPath.academic.years}/`,
          headers,
          {}
        ),
        loadAllAcademicSections(),
        loadDrfListAll<{ id: number; name: string }>(
          base,
          `${checkinPath.academic.groups}/`,
          headers,
          {}
        ),
      ])
      const yMap = new Map(years.map((y) => [y.id, y.name]))
      const secMap = new Map(sections.map((x) => [x.id, x.name]))
      const gMap = new Map(groups.map((g) => [g.id, g.name]))
      setData(mapStudents(rawStudents, yMap, secMap, gMap))
    } catch {
      setLoadError(
        isArabic
          ? "تعذر تحميل الطلاب. تحقق من الاتصال والصلاحيات."
          : "Could not load students. Check the connection and your permissions."
      )
      setData([])
    } finally {
      setLoading(false)
    }
  }, [isArabic, mapStudents])

  useEffect(() => {
    void loadStudents()
  }, [loadStudents])

  const yearOptions = useMemo(() => collectYears(data), [data])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((row) => {
      const matchesSearch =
        q.length === 0 ||
        row.id.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.year.toLowerCase().includes(q) ||
        row.section.toLowerCase().includes(q) ||
        row.group.toLowerCase().includes(q)

      if (!matchesSearch) return false
      if (yearFilter !== "all" && row.year !== yearFilter) return false
      return true
    })
  }, [data, yearFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPageSafe = Math.min(currentPage, totalPages)
  const pageStart = (currentPageSafe - 1) * PAGE_SIZE
  const visibleRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE)

  const allVisibleSelected =
    visibleRows.length > 0 && visibleRows.every((row) => selectedIds.has(row.id))

  const hasSelection = selectedIds.size > 0

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        for (const row of visibleRows) next.delete(row.id)
      } else {
        for (const row of visibleRows) next.add(row.id)
      }
      return next
    })
  }

  const pageItems = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1)

    const items: number[] = [1]
    if (currentPageSafe > 3) items.push(-1)

    const start = Math.max(2, currentPageSafe - 1)
    const end = Math.min(totalPages - 1, currentPageSafe + 1)
    for (let page = start; page <= end; page += 1) items.push(page)

    if (currentPageSafe < totalPages - 2) items.push(-2)
    items.push(totalPages)
    return items
  }, [currentPageSafe, totalPages])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleRowSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteSelected = async () => {
    if (!hasSelection) return
    const ids = [...selectedIds]
    for (const userId of ids) {
      const res = await deleteUserById(userId)
      if (!res.ok) {
        setLoadError(
          isArabic
            ? "تعذر حذف مستخدم. قد تكون الصلاحيات غير كافية."
            : "Could not delete a user. You may not have admin permissions."
        )
        return
      }
    }
    setSelectedIds(new Set())
    setExpandedIds(new Set())
    await loadStudents()
  }

  const filterLabelText =
    yearFilter === "all" ? (isArabic ? "الكل" : "All years") : yearFilter

  const colCount = 7

  return (
    <section className="mx-auto w-full min-w-0 max-w-full space-y-3 overflow-x-hidden rounded-xl border border-[#51689A]/30 bg-[#F6F7FE]/40 p-4 shadow-sm">
      {loadError && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
      )}
      <div className="flex flex-col gap-3 rounded-lg border border-[#74A7BD]/30 bg-[#F6F7FE] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[#1B2065F2]">
          <span className="flex h-fit w-fit items-center justify-center rounded-sm border border-[#51689A] bg-white shadow-sm ">
            <Users size={18} className="text-[#1B2065F2]" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-semibold sm:text-base">
            {isArabic ? "قائمة الطلاب" : "Student list"}
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:flex-1 sm:justify-end">
          <div className="relative w-full min-w-0 sm:w-[253px] sm:max-w-[253px] sm:flex-initial">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
              placeholder={isArabic ? "ابحث..." : "Search..."}
              className="h-[43px] rounded-lg border border-[#51689A]/35 bg-[#FEF9F9] pe-9 ps-3 text-sm text-[#1B2065F2] shadow-sm focus-visible:ring-[#51689A]/40 sm:h-9"
            />
            <Search
              className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-[#1B2065F2]/70"
              strokeWidth={2}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <DropdownMenu open={openFilter} onOpenChange={setOpenFilter}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={`${controlBtnClass} inline-flex h-[43px] min-w-0 items-center justify-center gap-1.5 bg-[#FEF9F9] px-3 sm:h-9`}
                >
                  <Funnel size={16} className="shrink-0" strokeWidth={1.75} />
                  <span className="font-medium">
                    {isArabic ? "تصفية" : "Filter"}
                  </span>
                  <span className="max-w-[5rem] truncate text-xs text-[#1B2065F2]/80 sm:max-w-none sm:inline">
                    ({filterLabelText})
                  </span>
                  {openFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem] p-0">
                <DropdownMenuItem
                  onClick={() => {
                    setYearFilter("all")
                    setCurrentPage(1)
                  }}
                >
                  <span>{isArabic ? "كل السنوات" : "All years"}</span>
                  {yearFilter === "all" && <Check className="ms-auto size-4" />}
                </DropdownMenuItem>
                {yearOptions.map((y) => (
                  <DropdownMenuItem
                    key={y}
                    onClick={() => {
                      setYearFilter(y)
                      setCurrentPage(1)
                    }}
                  >
                    <span>{y}</span>
                    {yearFilter === y && <Check className="ms-auto size-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-1 border-[#51689A]/30 sm:gap-1.5 sm:border-s sm:ps-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={`${controlBtnClass} h-fit w-fit bg-[#FEF9F9] px-[6px] py-px`}
                disabled
                title={isArabic ? "تعديل (قريباً)" : "Edit (coming soon)"}
                aria-label={isArabic ? "تعديل" : "Edit"}
              >
                <Pencil size={18} strokeWidth={1.5} className="text-[#1B2065F2]" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={`${controlBtnClass} h-fit w-fit bg-[#FEF9F9] px-[6px] py-px`}
                disabled
                title={isArabic ? "إضافة (قريباً)" : "Add (coming soon)"}
                aria-label={isArabic ? "إضافة طالب" : "Add student"}
              >
                <UserPlus size={18} strokeWidth={1.5} className="text-[#1B2065F2]" />
              </Button>
              {hasSelection && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={`${controlBtnClass} h-fit w-fit bg-[#FEF9F9] px-[6px] py-px text-destructive hover:text-destructive`}
                  onClick={handleDeleteSelected}
                  title={isArabic ? "حذف المحدد" : "Delete selected"}
                  aria-label={isArabic ? "حذف" : "Delete"}
                >
                  <Trash2 size={18} strokeWidth={1.5} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#74A7BD]/30 bg-white/90">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-[#51689A]/20 bg-gradient-to-r from-white to-[#F6F8FF] text-[#1B2065F2]">
                <th className="w-12 min-w-12 border-b border-[#D6DEEF] px-1 py-2.5 text-center sm:px-2">
                  <div className="flex items-center justify-center gap-0.5">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleSelectAllVisible}
                      aria-label={isArabic ? "تحديد الصفحة" : "Select page"}
                      className="appearance-none rounded-full border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white"
                    />
                    <span className="inline-block w-6 shrink-0" aria-hidden />
                  </div>
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "الرقم" : "User ID"}
                </th>
                <th className="min-w-0 max-w-[min(28vw,8rem)] border-b border-[#D6DEEF] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:max-w-none sm:px-2 sm:text-sm">
                  {isArabic ? "الاسم" : "Name"}
                </th>
                <th className="hidden min-w-0 border-b border-[#D6DEEF] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide md:table-cell sm:px-2 sm:text-sm">
                  {isArabic ? "البريد" : "Email Address"}
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "السنة" : "Year"}
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "الشعبة" : "Section"}
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "المجموعة" : "Group"}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={colCount} className="px-2 py-8 text-center text-sm text-[#5D719D]">
                    {isArabic ? "جارٍ التحميل…" : "Loading…"}
                  </td>
                </tr>
              )}
              {!loading &&
                visibleRows.map((row, vIdx) => {
                const isOpen = expandedIds.has(row.id)
                const stripe = vIdx % 2 === 0
                return (
                  <Fragment key={row.id}>
                    <tr
                      className={`border-b border-[#D6DEEF] text-[#1B2065F2] ${
                        stripe
                          ? "bg-gradient-to-r from-white to-[#EEF3FB]/80"
                          : "bg-gradient-to-r from-[#F5F8FD]/90 to-white"
                      }`}
                    >
                      <td className="w-12 min-w-12 align-middle">
                        <div className="flex min-h-[2.75rem] items-center justify-center gap-0.5 px-0.5 py-1.5 sm:px-1">
                          <Checkbox
                            checked={selectedIds.has(row.id)}
                            onCheckedChange={() => toggleRowSelect(row.id)}
                            aria-label={`${isArabic ? "تحديد" : "Select"} ${row.name}`}
                            className="appearance-none rounded-full border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => toggleExpand(row.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#1B2065F2] hover:bg-[#E8ECF4]/80"
                            aria-expanded={isOpen}
                            aria-label={
                              isArabic
                                ? "توسيع الغياب المبرر"
                                : "Expand justified absences"
                            }
                          >
                            {isOpen ? (
                              <ChevronDown size={16} strokeWidth={2} />
                            ) : (
                              <ChevronRight size={16} strokeWidth={2} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="min-w-0 max-w-24 font-mono text-[10px] align-middle sm:max-w-none sm:px-1 sm:py-2.5 sm:text-xs">
                        {row.id}
                      </td>
                      <td className="min-w-0 max-w-[min(28vw,8rem)] break-words align-middle pe-0.5 sm:max-w-none sm:px-1 sm:py-2.5">
                        {row.name}
                      </td>
                      <td className="hidden min-w-0 align-middle md:table-cell sm:px-1 sm:py-2.5">
                        <a
                          href={`mailto:${row.email}`}
                          className="break-all text-[#51689A] underline decoration-[#51689A] underline-offset-2 visited:text-[#51689A] hover:text-[#3d5280]"
                        >
                          {row.email}
                        </a>
                      </td>
                      <td className="min-w-0 align-middle text-[#51689A] sm:px-1 sm:py-2.5">
                        {row.year}
                      </td>
                      <td className="min-w-0 align-middle text-[#51689A] sm:px-1 sm:py-2.5">
                        {row.section}
                      </td>
                      <td className="min-w-0 align-middle sm:px-1 sm:py-2.5">
                        <span className="font-medium text-[#6CB4B4]">{row.group}</span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-[#D6DEEF] bg-[#E0E4F0]/50">
                        <td colSpan={colCount} className="p-0">
                          <div
                            className="px-2 py-3 sm:px-4 sm:py-4"
                            dir={isArabic ? "rtl" : "ltr"}
                          >
                            <p className="mb-3 text-xs font-medium text-[#51689A] sm:text-sm">
                              {isArabic ? "الغيابات المبررة" : "Justified Absences"}
                            </p>
                            <ul className="space-y-2.5">
                              {row.justifiedSemesters.length === 0 ? (
                                <li className="text-sm text-[#5D719D]">
                                  {isArabic
                                    ? "لا بيانات غياب مبرر من الخادم على هذا المقتطف."
                                    : "No justified-absence data from the server for this list."}
                                </li>
                              ) : (
                                row.justifiedSemesters.map((j) => (
                                  <li
                                    key={j.id}
                                    className="relative flex min-h-[3rem] items-center rounded-lg border border-[#74A7BD]/45 bg-white px-4 py-3 shadow-sm"
                                  >
                                    <span className="text-sm font-medium text-[#51689A]">
                                      {isArabic ? j.labelAr : j.labelEn}
                                    </span>
                                    <span className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-semibold tabular-nums text-[#1B2065F2]">
                                      {j.count}/{j.max}
                                    </span>
                                  </li>
                                ))
                              )}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {!loading && visibleRows.length === 0 && (
          <p className="py-5 text-center text-sm text-[#5D719D]">
            {isArabic ? "لا توجد نتائج." : "No matching students found."}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-2 rounded-lg border border-[#51689A]/40 bg-white px-3 py-2 sm:flex-row">
        <p className="text-xs text-[#5D719D]">
          {isArabic
            ? `الصفحة ${currentPageSafe} من ${totalPages}`
            : `Page ${currentPageSafe} of ${totalPages}`}
        </p>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text={isArabic ? "السابق" : "Previous"}
                className={currentPageSafe === 1 ? "pointer-events-none opacity-50" : ""}
                onClick={(event) => {
                  event.preventDefault()
                  changePage(currentPageSafe - 1)
                }}
              />
            </PaginationItem>

            {pageItems.map((item, index) => (
              <PaginationItem key={`${item}-${index}`}>
                {item < 0 ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={item === currentPageSafe}
                    onClick={(event) => {
                      event.preventDefault()
                      changePage(item)
                    }}
                  >
                    {item}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                text={isArabic ? "التالي" : "Next"}
                className={currentPageSafe === totalPages ? "pointer-events-none opacity-50" : ""}
                onClick={(event) => {
                  event.preventDefault()
                  changePage(currentPageSafe + 1)
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </section>
  )
}
