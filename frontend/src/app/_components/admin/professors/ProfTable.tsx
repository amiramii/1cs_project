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
  UserPlus,
  Users,
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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
import { subscribeAdminCsvUploadSuccess } from "@/lib/adminCsvUploadRefresh"
import { createTeacherManual } from "@/lib/manualUserCreate"
import { isNetworkFailure, apiUnreachableMessage } from "@/lib/fetchErrors"

type Semester = "S1" | "S2"

type ModuleDetail = {
  id: string
  module: string
  year: string
  groups: string
  semester: Semester
}

type ProfessorRow = {
  id: string
  name: string
  email: string
  modules: ModuleDetail[]
}

type ApiTeachingAssignment = {
  id: number
  group: number
  module: number
  year: string
  semester: string
}

type ApiTeacherRow = {
  id: number
  full_name: string
  email: string
  assignments: ApiTeachingAssignment[]
}

const controlBtnClass =
  "h-[43px] min-h-[43px] shrink-0 rounded-lg border border-[#51689A]/35 bg-white px-2.5 text-[#1B2065F2] shadow-sm hover:bg-[#FDFDFF] sm:h-9 sm:min-h-0 dark:border-[#383F58] dark:bg-[#1A2036] dark:text-[#EEF4F7] dark:hover:bg-[#242A40]"

const PAGE_SIZE = 5

function countDistinctYears(modules: ModuleDetail[]) {
  return new Set(modules.map((m) => m.year.trim())).size
}

function collectYears(rows: ProfessorRow[]) {
  const s = new Set<string>()
  for (const r of rows) for (const m of r.modules) s.add(m.year)
  return Array.from(s).sort()
}

/** One row per module + year + semester; groups merged (e.g. G1, G2). */
function mergeAssignmentsByModule(
  teacherId: number,
  assignments: ApiTeachingAssignment[],
  modMap: Map<number, string>,
  groupMap: Map<number, string>
): ModuleDetail[] {
  const bucket = new Map<
    string,
    { module: string; year: string; semester: Semester; groups: Set<string> }
  >()

  for (const a of assignments) {
    const moduleName = modMap.get(a.module) ?? `#${a.module}`
    const year = a.year?.trim() ?? ""
    const semester: Semester =
      a.semester === "S1" || a.semester === "S2" ? a.semester : "S1"
    const key = `${a.module}|${year}|${semester}`

    let entry = bucket.get(key)
    if (!entry) {
      entry = { module: moduleName, year, semester, groups: new Set() }
      bucket.set(key, entry)
    }
    const groupName = groupMap.get(a.group) ?? `#${a.group}`
    entry.groups.add(groupName)
  }

  return Array.from(bucket.entries()).map(([key, entry]) => {
    const groups = Array.from(entry.groups).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    )
    return {
      id: `ta-${teacherId}-${key}`,
      module: entry.module,
      year: entry.year,
      groups: groups.join(", "),
      semester: entry.semester,
    }
  })
}

export default function DataTable() {
  const { language } = useLanguage()
  const isArabic = language === "ar"
  const [data, setData] = useState<ProfessorRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [openFilter, setOpenFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [drawerMode, setDrawerMode] = useState<"add" | "edit" | null>(null)
  const [savingDrawer, setSavingDrawer] = useState(false)
  const [teacherForm, setTeacherForm] = useState({
    full_name: "",
    email: "",
    module: "",
    groups: "",
    semester: "S1",
    section: "",
    year: "",
  })

  const mapTeacherToRow = useCallback(
    (
      t: ApiTeacherRow,
      modMap: Map<number, string>,
      groupMap: Map<number, string>
    ): ProfessorRow => {
      const modules = mergeAssignmentsByModule(
        t.id,
        t.assignments ?? [],
        modMap,
        groupMap
      )
      return {
        id: String(t.id),
        name: t.full_name,
        email: t.email,
        modules,
      }
    },
    []
  )

  const loadProfessors = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const token = getAccessToken()
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    }
    const base = getApiBaseUrl()
    try {
      const [teachers, modules, groups] = await Promise.all([
        loadDrfListAll<ApiTeacherRow>(base, `${checkinPath.teachers}/`, headers, {}),
        loadDrfListAll<{ id: number; name: string }>(
          base,
          `${checkinPath.academic.modules}/`,
          headers,
          {}
        ),
        loadDrfListAll<{ id: number; name: string }>(
          base,
          `${checkinPath.academic.groups}/`,
          headers,
          {}
        ),
      ])
      const modMap = new Map(modules.map((m) => [m.id, m.name]))
      const groupMap = new Map(groups.map((g) => [g.id, g.name]))
      setData(
        teachers.map((t) => mapTeacherToRow(t, modMap, groupMap))
      )
    } catch {
      setLoadError(
        isArabic
          ? "تعذر تحميل الأساتذة. تحقق من الاتصال والصلاحيات."
          : "Could not load teachers. Check the connection and your permissions."
      )
      setData([])
    } finally {
      setLoading(false)
    }
  }, [isArabic, mapTeacherToRow])

  useEffect(() => {
    void loadProfessors()
  }, [loadProfessors])

  useEffect(() => {
    return subscribeAdminCsvUploadSuccess("teacher", () => {
      void loadProfessors()
    })
  }, [loadProfessors])

  const yearOptions = useMemo(() => collectYears(data), [data])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((row) => {
      const matchesSearch =
        q.length === 0 ||
        row.id.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.modules.some((module) =>
          `${module.module} ${module.year} ${module.groups} ${module.semester}`
            .toLowerCase()
            .includes(q)
        )

      if (!matchesSearch) return false

      if (yearFilter !== "all" && !row.modules.some((m) => m.year === yearFilter)) {
        return false
      }
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
    for (const tid of ids) {
      const res = await deleteTeacherById(tid)
      if (!res.ok) {
        setLoadError(
          isArabic
            ? "تعذر حذف الأستاذ. قد تكون الصلاحيات غير كافية."
            : "Could not delete a teacher. You may lack permissions."
        )
        return
      }
    }
    setSelectedIds(new Set())
    setExpandedIds(new Set())
    await loadProfessors()
  }

  const filterLabelText =
    yearFilter === "all"
      ? isArabic
        ? "الكل"
        : "All years"
      : yearFilter

  const colCount = 6
  const selectedTeacher = useMemo(() => {
    const firstId = [...selectedIds][0]
    return data.find((row) => row.id === firstId) ?? null
  }, [data, selectedIds])

  const openAddDrawer = () => {
    setTeacherForm({
      full_name: "",
      email: "",
      module: "",
      groups: "",
      semester: "S1",
      section: "",
      year: "",
    })
    setDrawerMode("add")
  }

  const openEditDrawer = () => {
    if (!selectedTeacher) {
      setLoadError(isArabic ? "اختر أستاذًا واحدًا للتعديل." : "Select one professor to edit.")
      return
    }
    setTeacherForm({
      full_name: selectedTeacher.name,
      email: selectedTeacher.email,
      module: "",
      groups: "",
      semester: "S1",
      section: "",
      year: "",
    })
    setDrawerMode("edit")
  }

  const submitTeacherDrawer = async () => {
    if (drawerMode !== "add") {
      setLoadError(
        isArabic
          ? "تعديل الأستاذ يحتاج مسار تحديث مناسب في الخادم."
          : "Professor edit needs a proper backend update endpoint for nested user and assignment fields."
      )
      return
    }
    setSavingDrawer(true)
    setLoadError(null)
    try {
      await createTeacherManual({
        full_name: teacherForm.full_name,
        email: teacherForm.email,
        module: teacherForm.module,
        groups: teacherForm.groups,
        semester: teacherForm.semester,
        section: teacherForm.section,
        year: teacherForm.year,
      })
      setDrawerMode(null)
      await loadProfessors()
    } catch (error) {
      setLoadError(
        isNetworkFailure(error)
          ? apiUnreachableMessage(getApiBaseUrl(), isArabic)
          : error instanceof Error && error.message.trim()
            ? error.message
            : isArabic
              ? "تعذر حفظ الأستاذ."
              : "Could not save professor."
      )
    } finally {
      setSavingDrawer(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-full min-w-0 space-y-3 overflow-x-hidden rounded-xl border border-[#51689A]/30 bg-[#F6F7FE]/40 p-4 shadow-sm dark:border-[#383F58] dark:bg-[#13182A]/40">
      {loadError && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
      )}
      <div className="flex flex-col gap-3 rounded-lg border border-[#74A7BD]/30  from-white to-[#FEF9F9]/90 p-3 sm:flex-row sm:items-center sm:justify-between bg-[#F6F7FE] dark:border-[#74A7BD]/25 dark:bg-[#1A2036]">
        <div className="flex items-center gap-2 text-[#1B2065F2] dark:text-[#EEF4F7] ">
          <span className="flex h-fit w-fit items-center justify-center rounded-sm border border-[#51689A] bg-white shadow-sm dark:border-[#383F58] dark:bg-[#242A40]">
            <Users size={18} className="text-[#1B2065F2] dark:text-[#EEF4F7]" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-semibold sm:text-base">
            {isArabic ? "قائمة الأساتذة" : "Professor list"}
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
              className="h-[43px] rounded-lg border border-[#51689A]/35 bg-[#FEF9F9] pe-9 ps-3 text-sm text-[#1B2065F2] shadow-sm focus-visible:ring-[#51689A]/40 sm:h-9 dark:border-[#383F58] dark:bg-[#1A2036] dark:text-[#EEF4F7] dark:placeholder:text-[#9BA8C4] "
            />
            <Search
              className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-[#1B2065F2]/70 dark:text-[#9BA8C4] "
              strokeWidth={2}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 ">
            <DropdownMenu open={openFilter} onOpenChange={setOpenFilter}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={`${controlBtnClass} inline-flex h-[43px] min-w-0 items-center justify-center gap-1.5 px-3 sm:h-9 bg-[#FEF9F9]`}
                >
                  <Funnel size={16} className="shrink-0" strokeWidth={1.75} />
                  <span className="font-medium">
                    {isArabic ? "تصفية" : "Filter"}
                  </span>
                  <span className="max-w-[5rem] truncate text-xs text-[#1B2065F2]/80 dark:text-[#9BA8C4] sm:max-w-none sm:inline">
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

            <div
              className="flex items-center gap-1 border-[#51689A]/30 dark:border-[#383F58] sm:gap-1.5 sm:border-s sm:ps-2"
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={`${controlBtnClass} py-[1px] px-[6px] bg-[#FEF9F9] h-fit w-fit`}
                onClick={openEditDrawer}
                title={isArabic ? "تعديل" : "Edit"}
                aria-label={isArabic ? "تعديل" : "Edit"}
              >
                <Pencil size={18} strokeWidth={1.5} className="text-[#1B2065F2] dark:text-[#EEF4F7]" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={`${controlBtnClass} py-[1px] px-[6px] bg-[#FEF9F9] h-fit w-fit`}
                onClick={openAddDrawer}
                title={isArabic ? "إضافة" : "Add"}
                aria-label={isArabic ? "إضافة مستخدم" : "Add user"}
              >
                <UserPlus size={18} strokeWidth={1.5} className="text-[#1B2065F2] dark:text-[#EEF4F7]" />
              </Button>
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
      </div>

      <div className="overflow-hidden rounded-lg border border-[#74A7BD]/30 bg-white/90 dark:border-[#74A7BD]/25 dark:bg-[#1A2036]/90">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-[#51689A]/20 bg-gradient-to-r from-white to-[#F6F8FF] text-[#1B2065F2] dark:border-[#383F58] dark:bg-gradient-to-r dark:from-[#1A2036] dark:to-[#242A40] dark:text-[#EEF4F7]">
                <th className="w-12 min-w-12 border-b border-[#D6DEEF] dark:border-[#383F58] px-1 py-2.5 text-center sm:px-2">
                  <div className="flex items-center justify-center gap-0.5">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleSelectAllVisible}
                      aria-label={isArabic ? "تحديد الصفحة" : "Select page"}
                      className="border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white appearance-none rounded-full dark:border-[#74A7BD] dark:data-[state=checked]:bg-[#74A7BD]"
                    />
                    <span className="inline-block w-6 shrink-0" aria-hidden />
                  </div>
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] dark:border-[#383F58] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "الرقم" : "User ID"}
                </th>
                <th className="min-w-0 max-w-[min(28vw,8rem)] border-b border-[#D6DEEF] dark:border-[#383F58] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:max-w-none sm:px-2 sm:text-sm">
                  {isArabic ? "الاسم" : "Name"}
                </th>
                <th className="hidden min-w-0 border-b border-[#D6DEEF] dark:border-[#383F58] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide md:table-cell sm:px-2 sm:text-sm">
                  {isArabic ? "البريد" : "Email Address"}
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] dark:border-[#383F58] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "المواد" : "Modules"}
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] dark:border-[#383F58] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "المستويات" : "Levels"}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={colCount} className="px-2 py-8 text-center text-sm text-[#5D719D] dark:text-[#9BA8C4]">
                    {isArabic ? "جارٍ التحميل…" : "Loading…"}
                  </td>
                </tr>
              )}
              {!loading &&
                visibleRows.map((row) => {
                const isOpen = expandedIds.has(row.id)
                const nMods = row.modules.length
                const nLevels = countDistinctYears(row.modules)
                return (
                  <Fragment key={row.id}>
                    <tr className="border-b border-[#D6DEEF] dark:border-[#383F58] bg-gradient-to-r from-white to-[#FFF5F0]/75 text-[#1B2065F2] dark:bg-gradient-to-r dark:from-[#1A2036] dark:to-[#242A40]/85 dark:text-[#EEF4F7]">
                      <td className="w-12 min-w-12 align-middle">
                        <div className="flex min-h-[2.75rem] items-center justify-center gap-0.5 px-0.5 py-1.5 sm:px-1">
                          <Checkbox
                            checked={selectedIds.has(row.id)}
                            onCheckedChange={() => toggleRowSelect(row.id)}
                            aria-label={`${isArabic ? "تحديد" : "Select"} ${row.name}`}
                            className="border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white appearance-none rounded-full dark:border-[#74A7BD] dark:data-[state=checked]:bg-[#74A7BD]"
                          />
                          <button
                            type="button"
                            onClick={() => toggleExpand(row.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#1B2065F2] hover:bg-[#E8ECF4]/80 dark:text-[#EEF4F7] dark:hover:bg-[#242A40]/80"
                            aria-expanded={isOpen}
                            aria-label={isArabic ? "توسيع المواد" : "Expand modules"}
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
                          className="break-all text-[#51689A] underline decoration-[#51689A] underline-offset-2 visited:text-[#51689A] hover:text-[#3d5280] dark:text-[#74A7BD] dark:visited:text-[#74A7BD] dark:hover:text-[#EEF4F7]"
                        >
                          {row.email}
                        </a>
                      </td>
                      <td className="min-w-0 align-middle sm:px-1 sm:py-2.5">
                        <span className="inline-flex items-center rounded-full border border-[#74A7BD]/50 bg-[#51689A]/10 px-2.5 py-0.5 text-xs font-medium text-[#51689A] dark:text-[#74A7BD]">
                          {nMods}{" "}
                          {isArabic
                            ? nMods === 1
                              ? "مادة"
                              : "مواد"
                            : nMods === 1
                              ? "module"
                              : "modules"}
                        </span>
                      </td>
                      <td className="min-w-0 align-middle sm:px-1 sm:py-2.5">
                        <span className="inline-flex items-center rounded-full bg-[#74A7BD]/20 px-2.5 py-0.5 text-xs font-medium text-[#74A7BD] border border-[#74A7BD] dark:text-[#74A7BD] ">
                          {nLevels}{" "}
                          {isArabic
                            ? nLevels === 1
                              ? "مستوى"
                              : "مستويات"
                            : nLevels === 1
                              ? "level"
                              : "levels"}
                        </span>
                      </td>
                      
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-[#D6DEEF] dark:border-[#383F58] bg-[#F6F7FE] dark:bg-[#242A40]/50">
                        <td colSpan={colCount} className="p-0">
                          <div
                            className="px-2 py-3 sm:px-4 sm:py-4"
                            dir={isArabic ? "rtl" : "ltr"}
                          >
                            <p className="mb-3 text-xs font-medium text-[#51689A] sm:text-sm dark:text-[#74A7BD]">
                              {isArabic ? "المواد" : "Modules"}
                            </p>
                            <ul className="space-y-2.5">
                              {row.modules.length === 0 && (
                                <li className="rounded-lg border border-dashed border-[#51689A]/50 bg-white px-3 py-2 text-xs text-[#51689A] dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#9BA8C4]">
                                  {isArabic ? "لا توجد مواد." : "No modules."}
                                </li>
                              )}
                              {row.modules.map((m) => (
                                <li
                                  key={m.id}
                                  className="rounded-lg border border-[#51689A]/45 bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3 dark:border-[#383F58] dark:bg-[#242A40]"
                                >
                                  <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_7.5rem_2.5rem] sm:items-center sm:gap-x-8 sm:gap-y-0">
                                    <span className="min-w-0 text-xs font-medium leading-snug text-[#1B2065F2] sm:text-sm dark:text-[#EEF4F7]">
                                      {m.module}
                                    </span>
                                    <span className="shrink-0 text-xs font-medium text-[#1B2065F2] dark:text-[#EEF4F7] sm:text-sm">
                                      {m.year}
                                    </span>
                                    <span className="min-w-0 break-words text-xs text-[#1B2065F2] dark:text-[#EEF4F7] sm:text-sm">
                                      {m.groups}
                                    </span>
                                    <span className="shrink-0 text-xs font-medium text-[#1B2065F2] dark:text-[#EEF4F7] sm:justify-self-end sm:text-sm md:justify-self-center">
                                      {m.semester}
                                    </span>
                                  </div>
                                </li>
                              ))}
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
          <p className="py-5 text-center text-sm text-[#5D719D] dark:text-[#9BA8C4]">
            {isArabic ? "لا توجد نتائج." : "No matching professors found."}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-2 rounded-lg border border-[#51689A]/40 bg-white px-3 py-2 sm:flex-row dark:border-[#383F58] dark:bg-[#1A2036]">
        <p className="text-xs text-[#5D719D] dark:text-[#9BA8C4]">
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
      <Drawer
        open={drawerMode !== null}
        onOpenChange={(open) => !open && setDrawerMode(null)}
        direction={isArabic ? "left" : "right"}
      >
        <DrawerContent dir={isArabic ? "rtl" : "ltr"}>
          <DrawerHeader>
            <DrawerTitle>
              {drawerMode === "add"
                ? isArabic
                  ? "إضافة أستاذ"
                  : "Add professor"
                : isArabic
                  ? "تعديل الأستاذ"
                  : "Edit professor"}
            </DrawerTitle>
            <DrawerDescription>
              {drawerMode === "add"
                ? isArabic
                  ? "إنشاء أستاذ وتعيين تدريسي."
                  : "Create a professor and teaching assignment."
                : isArabic
                  ? "التعديل الكامل يحتاج دعمًا إضافيًا من الخادم."
                  : "Full edit needs additional backend support."}
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-3">
            {[
              ["full_name", "full_name", "Dr Ahmed"],
              ["email", "email", "ahmed@gmail.com"],
              ["module", "module", "Network 1"],
              ["groups", "groups", "G1;G2;G3"],
              ["semester", "semester", "S1"],
              ["section", "section", "A"],
              ["year", "year", "1"],
            ].map(([key, label, placeholder]) => (
              <label key={key} className="grid gap-1 text-sm font-medium text-[#1B2065] dark:text-[#EEF4F7]">
                {label}
                <Input
                  value={teacherForm[key as keyof typeof teacherForm]}
                  disabled={drawerMode === "edit"}
                  placeholder={placeholder}
                  onChange={(e) =>
                    setTeacherForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="bg-white dark:bg-[#242A40]"
                />
              </label>
            ))}
          </div>
          <DrawerFooter>
            <Button
              onClick={submitTeacherDrawer}
              disabled={savingDrawer}
              className="bg-[#51689A] text-white hover:bg-[#40547F]"
            >
              {savingDrawer
                ? isArabic
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : isArabic
                  ? "حفظ"
                  : "Save"}
            </Button>
            <DrawerClose asChild>
              <Button type="button" variant="outline">
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </section>
  )
}
