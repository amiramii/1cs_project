"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
import { deleteTeacherById } from "@/lib/checkinClient"

type StaffRow = {
  id: string
  name: string
  email: string
  department: string
}

type ApiSchoolingRow = {
  id: number
  full_name: string
  email: string
  department: string
}

const controlBtnClass =
  "h-[43px] min-h-[43px] shrink-0 rounded-lg border border-[#51689A]/35 bg-white px-2.5 text-[#1B2065F2] shadow-sm hover:bg-[#FDFDFF] sm:h-9 sm:min-h-0"

const PAGE_SIZE = 10

export default function DataTable() {
  const { language } = useLanguage()
  const isArabic = language === "ar"
  const [data, setData] = useState<StaffRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const loadStaff = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const token = getAccessToken()
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    }
    const base = getApiBaseUrl()
    try {
      const staff = await loadDrfListAll<ApiSchoolingRow>(
        base,
        `${checkinPath.schooling}/`,
        headers,
        {}
      )
      setData(
        staff.map((s) => ({
          id: String(s.id),
          name: s.full_name,
          email: s.email,
          department: s.department || "-",
        }))
      )
    } catch {
      setLoadError(
        isArabic
          ? "تعذر تحميل الموظفين. تحقق من الاتصال والصلاحيات."
          : "Could not load staff. Check the connection and your permissions."
      )
      setData([])
    } finally {
      setLoading(false)
    }
  }, [isArabic])

  useEffect(() => {
    void loadStaff()
  }, [loadStaff])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((row) => {
      return (
        q.length === 0 ||
        row.id.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.department.toLowerCase().includes(q)
      )
    })
  }, [data, search])

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
    for (const tid of ids) {
      const res = await deleteTeacherById(tid)
      if (!res.ok) {
        setLoadError(
          isArabic
            ? "تعذر حذف الموظف. قد تكون الصلاحيات غير كافية."
            : "Could not delete staff member. You may lack permissions."
        )
        return
      }
    }
    setSelectedIds(new Set())
    await loadStaff()
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

  const colCount = 4

  return (
    <section className="mx-auto w-full max-w-full min-w-0 space-y-3 overflow-x-hidden rounded-xl border border-[#51689A]/30 bg-[#F6F7FE]/40 p-4 shadow-sm">
      {loadError && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
      )}
      <div className="flex flex-col gap-3 rounded-lg border border-[#74A7BD]/30  from-white to-[#FEF9F9]/90 p-3 sm:flex-row sm:items-center sm:justify-between bg-[#F6F7FE]">
        <div className="flex items-center gap-2 text-[#1B2065F2] ">
          <p className="text-sm font-semibold sm:text-base">
            {isArabic ? "قائمة الموظفين" : "Staff list"}
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
              className="h-[43px] rounded-lg border border-[#51689A]/35 bg-[#FEF9F9] pe-9 ps-3 text-sm text-[#1B2065F2] shadow-sm focus-visible:ring-[#51689A]/40 sm:h-9 "
            />
            <Search
              className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-[#1B2065F2]/70 "
              strokeWidth={2}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 ">
            {hasSelection && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={`${controlBtnClass}  text-destructive hover:text-destructive py-[1px] px-[6px] bg-[#FEF9F9] h-fit w-fit`}
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

      <div className="overflow-hidden rounded-lg border border-[#74A7BD]/30 bg-white/90">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-[#51689A]/20 bg-gradient-to-r from-white to-[#F6F8FF] text-[#1B2065F2]">
                <th className="w-12 min-w-12 border-b border-[#D6DEEF] px-1 py-2.5 text-center sm:px-2">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleSelectAllVisible}
                      aria-label={isArabic ? "تحديد الصفحة" : "Select page"}
                      className="border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white appearance-none rounded-full"
                    />
                  </div>
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "الرقم" : "User ID"}
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "الاسم" : "Name"}
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "البريد الإلكتروني" : "Email"}
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "القسم" : "Department"}
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
                visibleRows.map((row) => (
                  <tr key={row.id} className="border-b border-[#D6DEEF] bg-gradient-to-r from-white to-[#FFF5F0]/75 text-[#1B2065F2]">
                    <td className="w-12 min-w-12 align-middle">
                      <div className="flex min-h-[2.75rem] items-center justify-center gap-0.5 px-0.5 py-1.5 sm:px-1">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleRowSelect(row.id)}
                          aria-label={`${isArabic ? "تحديد" : "Select"} ${row.name}`}
                          className="border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white appearance-none rounded-full"
                        />
                      </div>
                    </td>
                    <td className="min-w-0 break-words align-middle pe-0.5 sm:px-1 sm:py-2.5">
                      {row.name}
                    </td>
                    <td className="min-w-0 align-middle sm:px-1 sm:py-2.5">
                      <a
                        href={`mailto:${row.email}`}
                        className="break-all text-[#51689A] underline decoration-[#51689A] underline-offset-2 visited:text-[#51689A] hover:text-[#3d5280]"
                      >
                        {row.email}
                      </a>
                    </td>
                    <td className="min-w-0 align-middle sm:px-1 sm:py-2.5">
                      <span className="inline-flex items-center rounded-full border border-[#74A7BD]/50 bg-[#51689A]/10 px-2.5 py-0.5 text-xs font-medium text-[#51689A]">
                        {row.department}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && visibleRows.length === 0 && (
          <p className="py-5 text-center text-sm text-[#5D719D]">
            {isArabic ? "لا توجد نتائج." : "No matching staff found."}
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
