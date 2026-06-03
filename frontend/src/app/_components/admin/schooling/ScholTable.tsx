"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, Funnel, Pencil, Search, Trash2, UserPlus } from "lucide-react"
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
import { deleteSchoolingById } from "@/lib/checkinClient"
import { subscribeAdminCsvUploadSuccess } from "@/lib/adminCsvUploadRefresh"
import { createSchoolingManual } from "@/lib/manualUserCreate"
import { updateSchoolingManual } from "@/lib/manualUserUpdate"
import { isNetworkFailure, apiUnreachableMessage } from "@/lib/fetchErrors"

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
  "h-[43px] min-h-[43px] shrink-0 rounded-lg border border-[#51689A]/35 bg-white px-2.5 text-[#1B2065F2] shadow-sm hover:bg-[#FDFDFF] sm:h-9 sm:min-h-0 dark:border-[#383F58] dark:bg-[#1A2036] dark:text-[#EEF4F7] dark:hover:bg-[#242A40]"

const PAGE_SIZE = 10

export default function DataTable() {
  const { language } = useLanguage()
  const isArabic = language === "ar"
  const [data, setData] = useState<StaffRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [openFilter, setOpenFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [drawerMode, setDrawerMode] = useState<"add" | "edit" | null>(null)
  const [savingDrawer, setSavingDrawer] = useState(false)
  const [staffForm, setStaffForm] = useState({
    full_name: "",
    email: "",
    department: "CP",
  })
  const [editPreviousEmail, setEditPreviousEmail] = useState("")

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

  useEffect(() => {
    return subscribeAdminCsvUploadSuccess("schooling", () => {
      void loadStaff()
    })
  }, [loadStaff])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((row) => {
      const matchesSearch =
        q.length === 0 ||
        row.id.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.department.toLowerCase().includes(q)
      if (!matchesSearch) return false
      if (
        departmentFilter !== "all" &&
        row.department.trim().toUpperCase() !== departmentFilter
      ) {
        return false
      }
      return true
    })
  }, [data, search, departmentFilter])

  const departmentOptions = useMemo(() => {
    const codes = new Set<string>()
    for (const row of data) {
      const code = row.department.trim().toUpperCase()
      if (code === "CS" || code === "CP") codes.add(code)
    }
    return [...codes].sort()
  }, [data])

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
      const res = await deleteSchoolingById(tid)
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

  const colCount = 5
  const selectedStaff = useMemo(() => {
    const firstId = [...selectedIds][0]
    return data.find((row) => row.id === firstId) ?? null
  }, [data, selectedIds])

  const openAddDrawer = () => {
    setStaffForm({ full_name: "", email: "", department: "CP" })
    setDrawerMode("add")
  }

  const openEditDrawer = () => {
    if (!selectedStaff) {
      setLoadError(isArabic ? "اختر موظفًا واحدًا للتعديل." : "Select one staff member to edit.")
      return
    }
    setStaffForm({
      full_name: selectedStaff.name,
      email: selectedStaff.email,
      department: selectedStaff.department === "CS" ? "CS" : "CP",
    })
    setEditPreviousEmail(selectedStaff.email)
    setDrawerMode("edit")
  }

  const submitStaffDrawer = async () => {
    setSavingDrawer(true)
    setLoadError(null)
    try {
      if (drawerMode === "add") {
        await createSchoolingManual({
          full_name: staffForm.full_name,
          email: staffForm.email,
          department: staffForm.department,
        })
      } else if (selectedStaff) {
        await updateSchoolingManual({
          schoolingId: selectedStaff.id,
          previousEmail: editPreviousEmail,
          email: staffForm.email,
          department: staffForm.department,
        })
      }
      setDrawerMode(null)
      setSelectedIds(new Set())
      await loadStaff()
    } catch (error) {
      setLoadError(
        isNetworkFailure(error)
          ? apiUnreachableMessage(getApiBaseUrl(), isArabic)
          : error instanceof Error && error.message.trim()
            ? error.message
            : isArabic
              ? "تعذر حفظ الموظف."
              : "Could not save staff member."
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
              className="h-[43px] rounded-lg border border-[#51689A]/35 bg-[#FEF9F9] pe-9 ps-3 text-sm text-[#1B2065F2] shadow-sm focus-visible:ring-[#51689A]/40 sm:h-9 dark:border-[#383F58] dark:bg-[#1A2036] dark:text-[#EEF4F7] dark:placeholder:text-[#9BA8C4] "
            />
            <Search
              className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-[#1B2065F2]/70 dark:text-[#9BA8C4] "
              strokeWidth={2}
            />
          </div>

          <DropdownMenu open={openFilter} onOpenChange={setOpenFilter}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={`${controlBtnClass} inline-flex items-center gap-1.5`}
              >
                <Funnel className="size-4 shrink-0" />
                <span>{isArabic ? "القسم" : "Department"}</span>
                <span className="text-xs text-muted-foreground">
                  ({departmentFilter === "all" ? (isArabic ? "الكل" : "All") : departmentFilter})
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem] p-0">
              <DropdownMenuItem
                onClick={() => {
                  setDepartmentFilter("all")
                  setCurrentPage(1)
                }}
              >
                <span>{isArabic ? "كل الأقسام" : "All departments"}</span>
                {departmentFilter === "all" && <Check className="ms-auto size-4" />}
              </DropdownMenuItem>
              {departmentOptions.map((dep) => (
                <DropdownMenuItem
                  key={dep}
                  onClick={() => {
                    setDepartmentFilter(dep)
                    setCurrentPage(1)
                  }}
                >
                  <span>{dep}</span>
                  {departmentFilter === dep && <Check className="ms-auto size-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex flex-wrap items-center gap-1.5 ">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={`${controlBtnClass} h-fit w-fit bg-[#FEF9F9] px-[6px] py-px`}
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
              className={`${controlBtnClass} h-fit w-fit bg-[#FEF9F9] px-[6px] py-px`}
              onClick={openAddDrawer}
              title={isArabic ? "إضافة" : "Add"}
              aria-label={isArabic ? "إضافة موظف" : "Add staff"}
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

      <div className="overflow-hidden rounded-lg border border-[#74A7BD]/30 bg-white/90 dark:border-[#74A7BD]/25 dark:bg-[#1A2036]/90">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-[#51689A]/20 bg-gradient-to-r from-white to-[#F6F8FF] text-[#1B2065F2] dark:border-[#383F58] dark:bg-gradient-to-r dark:from-[#1A2036] dark:to-[#242A40] dark:text-[#EEF4F7]">
                <th className="w-12 min-w-12 border-b border-[#D6DEEF] dark:border-[#383F58] px-1 py-2.5 text-center sm:px-2">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleSelectAllVisible}
                      aria-label={isArabic ? "تحديد الصفحة" : "Select page"}
                      className="border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white appearance-none rounded-full dark:border-[#74A7BD] dark:data-[state=checked]:bg-[#74A7BD]"
                    />
                  </div>
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] dark:border-[#383F58] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "الرقم" : "User ID"}
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] dark:border-[#383F58] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "الاسم" : "Name"}
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] dark:border-[#383F58] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "البريد الإلكتروني" : "Email"}
                </th>
                <th className="min-w-0 border-b border-[#D6DEEF] dark:border-[#383F58] px-1 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:px-2 sm:text-sm">
                  {isArabic ? "القسم" : "Department"}
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
                visibleRows.map((row) => (
                  <tr key={row.id} className="border-b border-[#D6DEEF] dark:border-[#383F58] bg-gradient-to-r from-white to-[#FFF5F0]/75 text-[#1B2065F2] dark:bg-gradient-to-r dark:from-[#1A2036] dark:to-[#242A40]/85 dark:text-[#EEF4F7]">
                    <td className="w-12 min-w-12 align-middle">
                      <div className="flex min-h-[2.75rem] items-center justify-center gap-0.5 px-0.5 py-1.5 sm:px-1">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleRowSelect(row.id)}
                          aria-label={`${isArabic ? "تحديد" : "Select"} ${row.name}`}
                          className="border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white appearance-none rounded-full dark:border-[#74A7BD] dark:data-[state=checked]:bg-[#74A7BD]"
                        />
                      </div>
                    </td>
                    <td className="min-w-0 max-w-24 font-mono text-[10px] align-middle sm:max-w-none sm:px-1 sm:py-2.5 sm:text-xs">
                      {row.id}
                    </td>
                    <td className="min-w-0 break-words align-middle pe-0.5 sm:px-1 sm:py-2.5">
                      {row.name}
                    </td>
                    <td className="min-w-0 align-middle sm:px-1 sm:py-2.5">
                      <a
                        href={`mailto:${row.email}`}
                        className="break-all text-[#51689A] underline decoration-[#51689A] underline-offset-2 visited:text-[#51689A] hover:text-[#3d5280] dark:text-[#74A7BD] dark:visited:text-[#74A7BD] dark:hover:text-[#EEF4F7]"
                      >
                        {row.email}
                      </a>
                    </td>
                    <td className="min-w-0 align-middle sm:px-1 sm:py-2.5">
                      <span className="inline-flex items-center rounded-full border border-[#74A7BD]/50 bg-[#51689A]/10 px-2.5 py-0.5 text-xs font-medium text-[#51689A] dark:text-[#74A7BD]">
                        {row.department}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && visibleRows.length === 0 && (
          <p className="py-5 text-center text-sm text-[#5D719D] dark:text-[#9BA8C4]">
            {isArabic ? "لا توجد نتائج." : "No matching staff found."}
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
        onOpenChange={(open: boolean) => {
          if (!open) setDrawerMode(null)
        }}
        direction={isArabic ? "left" : "right"}
      >
        <DrawerContent dir={isArabic ? "rtl" : "ltr"}>
          <DrawerHeader>
            <DrawerTitle>
              {drawerMode === "add"
                ? isArabic
                  ? "إضافة موظف"
                  : "Add staff member"
                : isArabic
                  ? "تعديل الموظف"
                  : "Edit staff member"}
            </DrawerTitle>
            <DrawerDescription>
              {drawerMode === "add"
                ? isArabic
                  ? "إنشاء حساب طاقم التعليم يدويًا."
                  : "Create a schooling staff account manually."
                : isArabic
                  ? "تعديل القسم المتاح من الواجهة الحالية."
                  : "Edit the department supported by the current backend."}
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-3">
            {[
              ["full_name", "full_name", "John Doe"],
              ["email", "email", "john.doe@example.com"],
            ].map(([key, label, placeholder]) => (
              <label key={key} className="grid gap-1 text-sm font-medium text-[#1B2065] dark:text-[#EEF4F7]">
                {label}
                <Input
                  value={staffForm[key as keyof typeof staffForm]}
                  placeholder={placeholder}
                  onChange={(e) =>
                    setStaffForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="bg-white dark:bg-[#242A40]"
                />
              </label>
            ))}
            <label className="grid gap-1 text-sm font-medium text-[#1B2065] dark:text-[#EEF4F7]">
              {isArabic ? "القسم" : "Department"}
              <select
                value={staffForm.department}
                onChange={(e) =>
                  setStaffForm((prev) => ({ ...prev, department: e.target.value }))
                }
                className="h-10 rounded-md border border-[#51689A]/35 bg-white px-3 text-sm text-[#1B2065] dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#EEF4F7]"
              >
                <option value="CP">CP</option>
                <option value="CS">CS</option>
              </select>
            </label>
          </div>
          <DrawerFooter>
            <Button
              onClick={submitStaffDrawer}
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
