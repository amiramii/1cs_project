"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Pencil,
  Search,
  SlidersHorizontal,
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useLanguage } from "@/app/_components/language-provider"

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

const PROFESSORS: ProfessorRow[] = [
  {
    id: "HBF0004",
    name: "Dr.Bensaber Mohamed",
    email: "m.bensaber@esi-sba.dz",
    modules: [
      {
        id: "HBF0004-M1",
        module: "Gestion des projets",
        year: "1CS",
        groups: "G1, G2, G3",
        semester: "S1",
      },
      {
        id: "HBF0004-M2",
        module: "Conduite de projets",
        year: "1CS",
        groups: "G1, G5",
        semester: "S2",
      },
      {
        id: "HBF0004-M3",
        module: "Architecture logicielle",
        year: "2CS",
        groups: "G2, G4",
        semester: "S1",
      },
    ],
  },
  {
    id: "HSF0008",
    name: "Dr Alami Nadir",
    email: "alami@esi-dz.edu",
    modules: [
      {
        id: "HSF0008-M1",
        module: "Bases de donnees",
        year: "2CS",
        groups: "G1, G2",
        semester: "S1",
      },
      {
        id: "HSF0008-M2",
        module: "Systemes d'information",
        year: "3CS",
        groups: "G3",
        semester: "S2",
      },
    ],
  },
  {
    id: "HSF0012",
    name: "Dr Rami Yassir",
    email: "ryassir@esi-dz.edu",
    modules: [
      {
        id: "HSF0012-M1",
        module: "Reseaux",
        year: "1CS",
        groups: "G1, G2",
        semester: "S2",
      },
      {
        id: "HSF0012-M2",
        module: "Securite",
        year: "3CS",
        groups: "G1",
        semester: "S1",
      },
      {
        id: "HSF0012-M3",
        module: "Cloud Computing",
        year: "3CS",
        groups: "G2, G3",
        semester: "S2",
      },
    ],
  },
  {
    id: "HSF0016",
    name: "Dr Sila Hana",
    email: "hana.sila@esi-dz.edu",
    modules: [
      {
        id: "HSF0016-M1",
        module: "Mathematiques",
        year: "1CS",
        groups: "G1, G2, G3",
        semester: "S1",
      },
      {
        id: "HSF0016-M2",
        module: "Probabilites",
        year: "2CS",
        groups: "G2",
        semester: "S2",
      },
    ],
  },
  {
    id: "HSF0020",
    name: "Dr Kamel Aziz",
    email: "k.aziz@esi-dz.edu",
    modules: [
      {
        id: "HSF0020-M1",
        module: "Analyse numerique",
        year: "2CS",
        groups: "G1, G5",
        semester: "S1",
      },
      {
        id: "HSF0020-M2",
        module: "Optimisation",
        year: "3CS",
        groups: "G4",
        semester: "S2",
      },
      {
        id: "HSF0020-M3",
        module: "Recherche operationnelle",
        year: "3CS",
        groups: "G2",
        semester: "S1",
      },
    ],
  },
  {
    id: "HSF0023",
    name: "Dr Mourad Karim",
    email: "m.karim@esi-dz.edu",
    modules: [
      {
        id: "HSF0023-M1",
        module: "Intelligence artificielle",
        year: "3CS",
        groups: "G1, G2",
        semester: "S2",
      },
      {
        id: "HSF0023-M2",
        module: "Apprentissage automatique",
        year: "3CS",
        groups: "G3",
        semester: "S1",
      },
      {
        id: "HSF0023-M3",
        module: "Python",
        year: "1CS",
        groups: "G4, G5",
        semester: "S2",
      },
    ],
  },
  {
    id: "HSF0029",
    name: "Dr Leila Nouri",
    email: "l.nouri@esi-dz.edu",
    modules: [
      {
        id: "HSF0029-M1",
        module: "Web development",
        year: "2CS",
        groups: "G1, G2",
        semester: "S1",
      },
      {
        id: "HSF0029-M2",
        module: "Mobile development",
        year: "2CS",
        groups: "G3",
        semester: "S2",
      },
      {
        id: "HSF0029-M3",
        module: "UX fundamentals",
        year: "1CS",
        groups: "G1, G5",
        semester: "S2",
      },
    ],
  },
]

type FilterId = "all" | "high-load" | "newcomers"

const FILTERS: { id: FilterId; labelEn: string; labelAr: string }[] = [
  { id: "all", labelEn: "All", labelAr: "الكل" },
  { id: "high-load", labelEn: "High Load", labelAr: "عبء مرتفع" },
  { id: "newcomers", labelEn: "Newcomers", labelAr: "جدد" },
]

const PAGE_SIZE = 5

export default function DataTable() {
  const { language } = useLanguage()
  const isArabic = language === "ar"
  const professors = PROFESSORS
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterId>("all")
  const [openFilter, setOpenFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return professors.filter((row) => {
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

      if (filter === "high-load") return row.modules.length >= 3
      if (filter === "newcomers")
        return row.modules.some((module) => module.year.trim().startsWith("1"))
      return true
    })
  }, [filter, professors, search])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPageSafe = Math.min(currentPage, totalPages)
  const pageStart = (currentPageSafe - 1) * PAGE_SIZE
  const visibleRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE)

  const allVisibleSelected =
    visibleRows.length > 0 &&
    visibleRows.every((row) => selectedIds.has(row.id))

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

  const primaryModule = (row: ProfessorRow) => row.modules[0] ?? null

  const formatModuleMeta = (m: ModuleDetail) =>
    `${m.year} · ${m.groups} · ${m.semester}`

  const filterLabel = FILTERS.find((item) => item.id === filter)
  const filterText = isArabic ? filterLabel?.labelAr : filterLabel?.labelEn

  return (
    <section className="mx-auto w-full max-w-full min-w-0 space-y-3 overflow-x-hidden rounded-xl border border-[#51689A]/30 bg-[#F6F7FE] p-4 shadow-sm">
      <div className="flex flex-col gap-3 rounded-lg border border-[#51689A]/40 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[#1B2065F2]">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#1B2065F2]/30 bg-[#EEF2FF]">
            <Users size={16} />
          </span>
          <p className="text-sm font-semibold sm:text-base">
            {isArabic ? "قائمة الأساتذة" : "Professor list"}
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:flex-1 sm:justify-end">
          <div className="relative w-full min-w-0 sm:max-w-xs sm:flex-1">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-[#1B2065F2]/70" size={16} />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
              placeholder={isArabic ? "ابحث..." : "Search..."}
              className="h-9 rounded-md border-[#51689A]/40 bg-[#FDFDFF] ps-8 pe-3 text-sm text-[#1B2065F2] focus-visible:ring-[#51689A]/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <DropdownMenu open={openFilter} onOpenChange={setOpenFilter}>
              <DropdownMenuTrigger asChild className="rounded-md">
                <Button size="sm" className="h-9 gap-1 font-light">
                  <SlidersHorizontal size={14} />
                  {isArabic ? "فلتر" : "Filter"}
                  <span className="hidden sm:inline">({filterText})</span>
                  {openFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-0">
                {FILTERS.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => {
                      setFilter(item.id)
                      setCurrentPage(1)
                    }}
                  >
                    <span>{isArabic ? item.labelAr : item.labelEn}</span>
                    {filter === item.id && <Check className="ms-auto" size={14} />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div
              className="flex items-center gap-0 border-[#51689A]/40 sm:border-s sm:ps-2"
              aria-hidden
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-[#1B2065F2] hover:bg-[#EEF2FF]/80"
                disabled
                title={isArabic ? "عرض فقط" : "View only"}
              >
                <Pencil size={18} strokeWidth={1.4} className="opacity-80" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-[#1B2065F2] hover:bg-[#EEF2FF]/80"
                disabled
                title={isArabic ? "عرض فقط" : "View only"}
              >
                <UserPlus size={18} strokeWidth={1.4} className="opacity-80" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-[#1B2065F2] hover:bg-[#EEF2FF]/80"
                disabled
                title={isArabic ? "عرض فقط" : "View only"}
              >
                <Trash2 size={18} strokeWidth={1.4} className="opacity-80" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#51689A]/40 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-[#51689A]/30 bg-[#F6F8FF] text-[#1B2065F2]">
                <th className="w-11 min-w-11 border-b border-[#D6DEEF] bg-[#F6F8FF] px-1 py-2 text-center sm:px-2">
                  <div className="flex items-center justify-center gap-0.5">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleSelectAllVisible}
                      aria-label={isArabic ? "تحديد الصفحة" : "Select page"}
                      className="border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white"
                    />
                    <span className="inline-block w-6 shrink-0" aria-hidden />
                  </div>
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] bg-[#F6F8FF] px-1 py-2 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "الرقم" : "User ID"}
                </th>
                <th className="min-w-0 max-w-[min(28vw,8rem)] border-b border-[#D6DEEF] bg-[#F6F8FF] px-1 py-2 text-start text-[11px] font-bold uppercase tracking-wide sm:max-w-none sm:px-2 sm:text-sm">
                  {isArabic ? "الاسم" : "Name"}
                </th>
                <th className="hidden min-w-0 border-b border-[#D6DEEF] bg-[#F6F8FF] px-1 py-2 text-start text-[11px] font-bold uppercase tracking-wide md:table-cell sm:px-2 sm:text-sm">
                  {isArabic ? "البريد" : "Email Address"}
                </th>
                <th className="hidden min-w-0 border-b border-[#D6DEEF] bg-[#F6F8FF] px-1 py-2 text-start text-[11px] font-bold uppercase tracking-wide sm:table-cell sm:px-2 sm:text-sm">
                  {isArabic ? "السنة" : "Year"}
                </th>
                <th className="hidden min-w-0 border-b border-[#D6DEEF] bg-[#F6F8FF] px-1 py-2 text-start text-[11px] font-bold uppercase tracking-wide sm:table-cell sm:px-2 sm:text-sm">
                  {isArabic ? "المجموعة" : "Group"}
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const isOpen = expandedIds.has(row.id)
                const pm = primaryModule(row)
                return (
                  <Fragment key={row.id}>
                    <tr className="border-b border-[#D6DEEF] bg-white text-[#1B2065F2]">
                      <td className="w-11 min-w-11 align-top">
                        <div className="flex h-full min-h-[2.5rem] items-center justify-center gap-0.5 px-0.5 py-1.5 sm:px-1">
                          <Checkbox
                            checked={selectedIds.has(row.id)}
                            onCheckedChange={() => toggleRowSelect(row.id)}
                            aria-label={`${isArabic ? "تحديد" : "Select"} ${row.name}`}
                            className="border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => toggleExpand(row.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#1B2065F2] hover:bg-[#EEF2FF]"
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
                      <td className="min-w-0 max-w-24 font-mono text-[10px] align-top sm:max-w-none sm:px-1 sm:py-2 sm:text-xs">
                        {row.id}
                      </td>
                      <td className="min-w-0 max-w-[min(28vw,8rem)] break-words align-top pe-0.5 pt-1.5 sm:max-w-none sm:px-1 sm:py-2">
                        {row.name}
                      </td>
                      <td className="hidden min-w-0 align-top md:table-cell sm:px-1 sm:py-2">
                        <a
                          href={`mailto:${row.email}`}
                          className="break-all text-[#2563EB] underline decoration-[#2563EB] underline-offset-2 visited:text-[#1d4ed8] hover:text-[#1d4ed8]"
                        >
                          {row.email}
                        </a>
                      </td>
                      <td className="hidden min-w-0 align-top sm:table-cell sm:px-1 sm:py-2">
                        {pm?.year ?? "—"}
                      </td>
                      <td className="hidden min-w-0 align-top sm:table-cell sm:px-1 sm:py-2">
                        {pm?.groups ?? "—"}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-[#D6DEEF] bg-[#F6F8FF]">
                        <td colSpan={6} className="p-0">
                          <div
                            className="border-t border-[#B8C4E0]/50 px-2 py-3 sm:ps-4 sm:pe-3"
                            dir={isArabic ? "rtl" : "ltr"}
                          >
                            <p className="mb-2.5 text-[11px] font-semibold text-[#1B2065F2] sm:text-xs">
                              {isArabic ? "المواد المدرّسة" : "Modules taught"}
                            </p>
                            <ul className="space-y-2">
                              {row.modules.length === 0 && (
                                <li className="rounded-md border border-dashed border-[#51689A]/50 bg-white px-3 py-2 text-xs text-[#5D719D]">
                                  {isArabic ? "لا توجد مواد." : "No modules."}
                                </li>
                              )}
                              {row.modules.map((m) => (
                                <li
                                  key={m.id}
                                  className="flex w-full min-w-0 items-center justify-between gap-3 rounded-md border border-[#74A7BD]/70 bg-white px-3 py-2.5 text-xs shadow-sm sm:px-4 sm:text-sm"
                                >
                                  <span className="min-w-0 flex-1 font-medium leading-snug text-[#1B2065F2]">
                                    {m.module}
                                  </span>
                                  <span className="shrink-0 text-end text-[11px] text-[#5D719D] sm:text-sm">
                                    {formatModuleMeta(m)}
                                  </span>
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

        {visibleRows.length === 0 && (
          <p className="py-5 text-center text-sm text-[#5D719D]">
            {isArabic ? "لا توجد نتائج." : "No matching professors found."}
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