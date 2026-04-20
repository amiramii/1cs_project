"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Check,
  ChevronDown,
  ChevronUp,
  PencilLine,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  const [professors, setProfessors] = useState<ProfessorRow[]>(PROFESSORS)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterId>("all")
  const [openFilter, setOpenFilter] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftProfessor, setDraftProfessor] = useState<ProfessorRow | null>(null)

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
    visibleRows.length > 0 && visibleRows.every((row) => selectedIds.includes(row.id))

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

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleSet = new Set(visibleRows.map((row) => row.id))
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)))
      return
    }

    const merged = new Set([...selectedIds, ...visibleRows.map((row) => row.id)])
    setSelectedIds(Array.from(merged))
  }

  const removeSelected = () => {
    if (selectedIds.length === 0) return
    setProfessors((prev) => prev.filter((row) => !selectedIds.includes(row.id)))
    if (editingId && selectedIds.includes(editingId)) {
      closeEditorSheet()
    }
    setSelectedIds([])
  }

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const getModuleNames = (row: ProfessorRow) =>
    Array.from(new Set(row.modules.map((module) => module.module)))
  const getYears = (row: ProfessorRow) =>
    Array.from(new Set(row.modules.map((module) => module.year)))

  const openProfessorSheet = (row: ProfessorRow) => {
    setEditingId(row.id)
    setDraftProfessor({
      ...row,
      modules: row.modules.map((module) => ({ ...module })),
    })
    setSheetOpen(true)
  }

  const updateDraftField = (field: "name" | "email", value: string) => {
    setDraftProfessor((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const updateDraftModule = (
    index: number,
    field: keyof ModuleDetail,
    value: string
  ) => {
    if (field === "id") return
    setDraftProfessor((prev) => {
      if (!prev) return prev
      const modules = prev.modules.map((module, moduleIndex) =>
        moduleIndex === index
          ? {
              ...module,
              [field]: field === "semester" ? (value as Semester) : value,
            }
          : module
      )
      return { ...prev, modules }
    })
  }

  const addDraftModule = () => {
    setDraftProfessor((prev) =>
      prev
        ? {
            ...prev,
            modules: [
              ...prev.modules,
              {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                module: "",
                year: "",
                groups: "",
                semester: "S1",
              },
            ],
          }
        : prev
    )
  }

  const removeDraftModule = (index: number) => {
    setDraftProfessor((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        modules: prev.modules.filter((_, moduleIndex) => moduleIndex !== index),
      }
    })
  }

  const saveDraft = () => {
    if (!draftProfessor || !editingId) return

    const cleanedDraft: ProfessorRow = {
      ...draftProfessor,
      id: editingId,
      name: draftProfessor.name.trim(),
      email: draftProfessor.email.trim(),
      modules: draftProfessor.modules.map((module) => ({
        ...module,
        module: module.module.trim(),
        year: module.year.trim(),
        groups: module.groups.trim(),
      })),
    }

    setProfessors((prev) =>
      prev.map((row) => (row.id === editingId ? cleanedDraft : row))
    )
    closeEditorSheet()
  }

  const closeEditorSheet = () => {
    setSheetOpen(false)
    setEditingId(null)
    setDraftProfessor(null)
  }

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      closeEditorSheet()
      return
    }
    setSheetOpen(open)
  }

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

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:min-w-44 sm:flex-1">
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

          {selectedIds.length > 0 && (
            <Button
              size="sm"
              onClick={removeSelected}
              className="h-9 w-9 bg-[#74A7BD] p-0 text-white hover:bg-[#5F8DA2]"
              aria-label={isArabic ? "إزالة المحدد" : "Remove selected professors"}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#51689A]/40 bg-white">
        <div className="overflow-x-hidden">
          <table className="w-full table-fixed text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#D6DEEF] bg-[#F6F8FF] text-[#1B2065F2]">
                <th className="w-10 shrink-0 bg-[#F6F8FF] px-1 py-1.5 text-center sm:px-2 sm:py-2">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={() => toggleSelectAllVisible()}
                    aria-label={isArabic ? "تحديد الكل" : "Select all"}
                    className="border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white"
                  />
                </th>
                <th className="w-[19%] bg-[#F6F8FF] px-1 py-1.5 text-left font-semibold md:w-[14%] lg:w-[12%] sm:px-2 sm:py-2">
                  {isArabic ? "الرقم" : "User ID"}
                </th>
                <th className="w-[46%] min-w-0 px-1 py-1.5 text-left font-semibold md:w-[16%] lg:w-[14%] sm:px-2 sm:py-2">
                  {isArabic ? "الاسم" : "Name"}
                </th>
                <th className="hidden w-[22%] px-1 py-1.5 text-left font-semibold md:table-cell lg:w-[20%] sm:px-2 sm:py-2">
                  {isArabic ? "البريد" : "Email Address"}
                </th>
                <th className="hidden w-[16%] px-1 py-1.5 text-left font-semibold lg:table-cell sm:px-2 sm:py-2">
                  {isArabic ? "المواد" : "Modules Taught"}
                </th>
                <th className="hidden w-[11%] px-1 py-1.5 text-left font-semibold lg:table-cell sm:px-2 sm:py-2">
                  {isArabic ? "سنوات التدريس" : "Years Taught"}
                </th>
                <th className="w-[16%] px-1 py-1.5 text-left font-semibold md:w-[14%] lg:w-[12%] sm:px-2 sm:py-2">
                  {isArabic ? "التفاصيل" : "Details"}
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className="border-b border-[#E6EBF5] text-[#1B2065F2]">
                  <td className="w-10 shrink-0 bg-white px-1 py-1.5 text-center align-top sm:px-2 sm:py-2">
                    <Checkbox
                      checked={selectedIds.includes(row.id)}
                      onCheckedChange={() => toggleSelection(row.id)}
                      aria-label={`${isArabic ? "تحديد" : "Select"} ${row.name}`}
                      className="border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white"
                    />
                  </td>
                  <td className="w-[19%] bg-white px-1 py-1.5 font-mono text-[10px] align-top md:w-[14%] lg:w-[12%] sm:px-2 sm:py-2 sm:text-xs">
                    {row.id}
                  </td>
                  <td
                    className="w-[46%] min-w-0 break-words px-1 py-1.5 align-top md:w-[16%] lg:w-[14%] sm:px-2 sm:py-2"
                    title={`${row.name}${row.email ? ` — ${row.email}` : ""}`}
                  >
                    {row.name}
                  </td>
                  <td className="hidden w-[22%] break-all px-1 py-1.5 text-[#5D719D] md:table-cell lg:w-[20%] sm:px-2 sm:py-2">
                    {row.email}
                  </td>
                  <td className="hidden w-[16%] px-1 py-1.5 align-top lg:table-cell sm:px-2 sm:py-2">
                    <div className="flex flex-wrap gap-1">
                      {getModuleNames(row).map((module) => (
                        <span
                          key={`${row.id}-${module}`}
                          className="rounded-full bg-[#EEF2FF] px-1.5 py-0.5 text-[10px] text-[#51689A] sm:px-2 sm:text-xs"
                        >
                          {module}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="hidden w-[11%] px-1 py-1.5 align-top lg:table-cell sm:px-2 sm:py-2">
                    <div className="flex flex-wrap gap-1">
                      {getYears(row).map((year) => (
                        <span
                          key={`${row.id}-${year}`}
                          className="rounded-full bg-[#E8F4F8] px-1.5 py-0.5 text-[10px] text-[#4A778D] sm:px-2 sm:text-xs"
                        >
                          {year}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="w-[16%] px-1 py-1.5 align-top md:w-[14%] lg:w-[12%] sm:px-2 sm:py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openProfessorSheet(row)}
                      className="h-8 max-w-full px-1 text-[#51689A] hover:bg-[#EEF2FF] sm:px-2"
                    >
                      <PencilLine size={14} />
                      <span className="hidden sm:inline">
                        {isArabic ? "تعديل" : "Edit"}
                      </span>
                    </Button>
                  </td>
                </tr>
              ))}
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

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side={isArabic ? "left" : "right"}
          className="w-full overflow-y-auto border-[#51689A]/30 bg-white/65 backdrop-blur-2xl dark:bg-slate-950/65 sm:max-w-2xl"
        >
          <SheetHeader>
            <SheetTitle>{isArabic ? "تفاصيل الأستاذ" : "Professor details"}</SheetTitle>
            <SheetDescription>
              {isArabic
                ? "يمكنك الاطلاع على معلومات الأستاذ وتعديلها."
                : "Consult and edit professor information and taught modules."}
            </SheetDescription>
          </SheetHeader>

          {draftProfessor && (
            <div className="space-y-4 px-4 pb-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-[#1B2065F2]">{isArabic ? "الرقم" : "User ID"}</span>
                  <div className="flex h-9 w-full items-center rounded-md border border-[#51689A]/40 bg-[#EEF2FF]/80 px-3 text-sm text-[#1B2065F2]">
                    {draftProfessor.id}
                  </div>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-[#1B2065F2]">{isArabic ? "الاسم" : "Name"}</span>
                  <Input
                    value={draftProfessor.name}
                    onChange={(event) => updateDraftField("name", event.target.value)}
                    className="h-9 rounded-md border-[#51689A]/40 bg-[#FDFDFF] text-sm text-[#1B2065F2] focus-visible:ring-[#51689A]/40"
                  />
                </label>
              </div>

              <label className="space-y-1 text-sm">
                <span className="text-[#1B2065F2]">
                  {isArabic ? "البريد الإلكتروني" : "Email Address"}
                </span>
                <Input
                  value={draftProfessor.email}
                  onChange={(event) => updateDraftField("email", event.target.value)}
                  className="h-9 rounded-md border-[#51689A]/40 bg-[#FDFDFF] text-sm text-[#1B2065F2] focus-visible:ring-[#51689A]/40"
                />
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#1B2065F2]">
                    {isArabic ? "تفاصيل المواد المدرسة" : "Modules taught details"}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDraftModule}
                    className="border-[#51689A]/40 text-[#51689A]"
                  >
                    <Plus size={14} />
                    {isArabic ? "إضافة مادة" : "Add module"}
                  </Button>
                </div>

                {draftProfessor.modules.length === 0 && (
                  <p className="rounded-md border border-dashed border-[#51689A]/40 bg-[#F6F8FF] p-3 text-xs text-[#5D719D]">
                    {isArabic
                      ? "لا توجد مواد حاليا. أضف مادة جديدة."
                      : "No modules yet. Add a new module."}
                  </p>
                )}

                {draftProfessor.modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="space-y-3 rounded-lg border border-[#51689A]/30 bg-white p-3"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1 text-sm">
                        <span className="text-[#1B2065F2]">{isArabic ? "المادة" : "Module"}</span>
                        <Input
                          value={module.module}
                          onChange={(event) =>
                            updateDraftModule(index, "module", event.target.value)
                          }
                          placeholder={isArabic ? "اسم المادة" : "Module name"}
                          className="h-9 rounded-md border-[#51689A]/40 bg-[#FDFDFF] text-sm text-[#1B2065F2] focus-visible:ring-[#51689A]/40"
                        />
                      </label>

                      <label className="space-y-1 text-sm">
                        <span className="text-[#1B2065F2]">{isArabic ? "السنة" : "Year"}</span>
                        <Input
                          value={module.year}
                          onChange={(event) => updateDraftModule(index, "year", event.target.value)}
                          placeholder={isArabic ? "مثال: 1CS" : "e.g. 1CS"}
                          className="h-9 rounded-md border-[#51689A]/40 bg-[#FDFDFF] text-sm text-[#1B2065F2] focus-visible:ring-[#51689A]/40"
                        />
                      </label>

                      <label className="space-y-1 text-sm">
                        <span className="text-[#1B2065F2]">{isArabic ? "المجموعات" : "Groups"}</span>
                        <Input
                          value={module.groups}
                          onChange={(event) =>
                            updateDraftModule(index, "groups", event.target.value)
                          }
                          placeholder={isArabic ? "مثال: G1, G2" : "e.g. G1, G2"}
                          className="h-9 rounded-md border-[#51689A]/40 bg-[#FDFDFF] text-sm text-[#1B2065F2] focus-visible:ring-[#51689A]/40"
                        />
                      </label>

                      <label className="space-y-1 text-sm">
                        <span className="text-[#1B2065F2]">{isArabic ? "السداسي" : "Semester"}</span>
                        <Select
                          value={module.semester}
                          onValueChange={(v) =>
                            updateDraftModule(index, "semester", v as Semester)
                          }
                        >
                          <SelectTrigger className="h-9 w-full rounded-md border-[#51689A]/40 bg-[#FDFDFF] px-3 text-sm text-[#1B2065F2] focus-visible:ring-[#51689A]/40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="S1">S1</SelectItem>
                            <SelectItem value="S2">S2</SelectItem>
                          </SelectContent>
                        </Select>
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDraftModule(index)}
                        className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={14} />
                        {isArabic ? "حذف المادة" : "Remove module"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <SheetFooter className="border-t border-[#51689A]/20 bg-white/95">
            <div className="flex w-full justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeEditorSheet}
              >
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="button"
                onClick={saveDraft}
                className="bg-[#51689A] text-white hover:bg-[#445680] hover:text-white"
              >
                {isArabic ? "حفظ التعديلات" : "Save changes"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  )
}