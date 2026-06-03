"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Trash2,
  Search,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useLanguage } from "@/app/_components/language-provider";
import { getApiBaseUrl } from "@/lib/apiBase";
import {
  loadTeacherAbsenceSchoolingList,
  deleteTeacherAbsenceById,
  patchTeacherAbsenceAccept,
  patchTeacherAbsenceRefuse,
  type TeacherAbsenceRequestRow,
} from "@/lib/checkinClient";
import { emitTeacherAbsenceSync } from "@/lib/absenceSync";
import ProfAbsencePopUpWindow from "./ProfAbsencePopUpWindow";

type JustificationRow = {
  id: string;
  requestId: number;
  name: string;
  email: string;
  startDate: string;
  endDate: string;
  state: string;
  absenceCause: string;
  justificationImageUrl?: string;
};

function getAbsenceStateClasses(state: string) {
  const normalized = state.trim().toLowerCase();
  if (normalized === "accepted") {
    return "border-[#74A7BD] bg-[#EEFAFF] text-[#74A7BD] dark:border-[#74A7BD] dark:bg-[#152A38] dark:text-[#74A7BD]";
  }
  if (normalized === "pending") {
    return "border-[#C4A820] bg-[#FFF5C3F2] text-[#9A7B0A] dark:border-[#FFD54F]/55 dark:bg-[#3A3420] dark:text-[#FFD54F]";
  }
  if (normalized === "rejected") {
    return "border-[#DF2D3E] bg-[#FFD1D5] text-[#DF2D3E] dark:border-[#E85462] dark:bg-[#3A1A22] dark:text-[#F0707A]";
  }
  return "border-[#51689A] bg-[#F3F6FF] text-[#1B2065F2] dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#EEF4F7]";
}

function resolveMediaUrl(file?: string | null): string | undefined {
  if (!file || typeof file !== "string") return undefined;
  const trimmed = file.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const base = getApiBaseUrl().replace(/\/+$/, "");
  return trimmed.startsWith("/") ? `${base}${trimmed}` : `${base}/${trimmed}`;
}

function formatIsoDate(iso: string, isAr: boolean): string {
  const [y, m, day] = iso.split("-").map(Number);
  if (!y || !m || !day) return iso;
  const dt = new Date(Date.UTC(y, m - 1, day));
  return new Intl.DateTimeFormat(isAr ? "ar-DZ" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dt);
}

function mapTeacherAbsenceRows(
  rows: TeacherAbsenceRequestRow[],
  isAr: boolean
): JustificationRow[] {
  return rows
    .map((row) => {
      const dates = (row.dates ?? [])
        .map((d) => d.date)
        .filter((d): d is string => typeof d === "string" && d.length > 0)
        .sort();
      const startIso = dates[0];
      const endIso = dates[dates.length - 1];
      const name =
        typeof row.teacher_name === "string" && row.teacher_name.trim()
          ? row.teacher_name.trim()
          : "—";
      const status =
        typeof row.status === "string" && row.status.trim()
          ? row.status.trim()
          : "pending";
      const displayStatus =
        status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

      return {
        id: String(row.id),
        requestId: row.id,
        name,
        email: `prof-${row.id}@local`,
        startDate: startIso ? formatIsoDate(startIso, isAr) : "—",
        endDate: endIso ? formatIsoDate(endIso, isAr) : "—",
        state: displayStatus,
        absenceCause:
          typeof row.reason === "string" && row.reason.trim()
            ? row.reason.trim()
            : "—",
        justificationImageUrl: resolveMediaUrl(row.file),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

const controlBtnClass =
  "h-[43px] min-h-[43px] shrink-0 rounded-lg border border-[#51689A]/35 bg-white px-2.5 text-[#1B2065F2] shadow-sm hover:bg-[#FDFDFF] sm:h-9 sm:min-h-0 dark:border-[#383F58] dark:bg-[#1A2036] dark:text-[#EEF4F7] dark:hover:bg-[#242A40]";

const PAGE_SIZE = 5;



export function ProfessorAbsenceTable({
  studentDetailHrefMode = "schoolingMock",
}: {
  /** Schooling uses the mock detail page; admins use the API-backed review screen. */
  studentDetailHrefMode?: "schoolingMock" | "backendReview"
} = {}) {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<JustificationRow[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<JustificationRow | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const raw = await loadTeacherAbsenceSchoolingList();
        const mapped = mapTeacherAbsenceRows(raw, isArabic);
        if (!cancelled) setData(mapped);
      } catch {
        toast.error(
          isArabic ? "تعذر تحميل طلبات التبرير." : "Could not load Absences."
        );
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isArabic, reloadNonce]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesSearch =
        q.length === 0 ||
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.startDate.toLowerCase().includes(q) ||
        row.endDate.toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStart = (currentPageSafe - 1) * PAGE_SIZE;
  const visibleRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE);

  const allVisibleSelected =
    visibleRows.length > 0 && visibleRows.every((r) => selectedIds.has(r.id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const row of visibleRows) next.delete(row.id);
      } else {
        for (const row of visibleRows) next.add(row.id);
      }
      return next;
    });
  };

  const toggleRowSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const hasSelection = selectedIds.size > 0;

  const handleDeleteSelected = async () => {
    if (!hasSelection) return;
    const selectedRows = data.filter((row) => selectedIds.has(row.id));
    if (selectedRows.length === 0) return;
    setLoading(true);
    try {
      for (const row of selectedRows) {
        const res = await deleteTeacherAbsenceById(row.requestId);
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t.trim() || `HTTP ${res.status}`);
        }
      }
      setData((prev) => prev.filter((row) => !selectedIds.has(row.id)));
      setSelectedIds(new Set());
      emitTeacherAbsenceSync();
      toast.success(
        isArabic ? "تم حذف الصفوف المحددة." : "Selected rows were deleted."
      );
    } catch {
      toast.error(
        isArabic ? "تعذر حذف بعض الصفوف." : "Could not delete some rows."
      );
    } finally {
      setLoading(false);
    }
  };

  const pageItems = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items: number[] = [1];
    if (currentPageSafe > 3) items.push(-1);
    const start = Math.max(2, currentPageSafe - 1);
    const end = Math.min(totalPages - 1, currentPageSafe + 1);
    for (let p = start; p <= end; p++) items.push(p);
    if (currentPageSafe < totalPages - 2) items.push(-2);
    items.push(totalPages);
    return items;
  }, [currentPageSafe, totalPages]);

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleStateClick = (row: JustificationRow) => {
    setSelectedRow(row);
    setIsPopupOpen(true);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedRow(null);
  };

  const handlePopupAccept = async () => {
    if (!selectedRow) return;
    try {
      const res = await patchTeacherAbsenceAccept(selectedRow.requestId);
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t.trim() || `HTTP ${res.status}`);
      }
      toast.success(isArabic ? "تم قبول الطلب." : "Request accepted.");
      emitTeacherAbsenceSync();
      setReloadNonce((n) => n + 1);
      handlePopupClose();
    } catch {
      toast.error(isArabic ? "تعذر قبول الطلب." : "Could not accept request.");
    }
  };

  const handlePopupReject = async () => {
    if (!selectedRow) return;
    try {
      const res = await patchTeacherAbsenceRefuse(selectedRow.requestId);
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t.trim() || `HTTP ${res.status}`);
      }
      toast.success(isArabic ? "تم رفض الطلب." : "Request refused.");
      emitTeacherAbsenceSync();
      setReloadNonce((n) => n + 1);
      handlePopupClose();
    } catch {
      toast.error(isArabic ? "تعذر رفض الطلب." : "Could not refuse request.");
    }
  };




  return (
    <section className="mx-auto w-full min-w-0 max-w-full space-y-3 overflow-x-hidden rounded-xl border border-[#51689A]/30 bg-[#F6F7FE]/40 p-4 shadow-sm dark:border-[#383F58] dark:bg-[#13182A]/40">
      {loading ? (
        <p className="text-sm text-[#51689AF2] dark:text-[#9BA8C4]">
          {isArabic ? "جاري التحميل…" : "Loading…"}
        </p>
      ) : null}
      {/* Header bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#74A7BD]/30 bg-[#F6F7FE] p-3 sm:flex-row sm:items-center sm:justify-between dark:border-[#74A7BD]/25 dark:bg-[#1A2036]">
        <div className="flex items-center gap-2 text-[#1B2065F2] dark:text-[#EEF4F7]">
          <span className="flex h-fit w-fit items-center justify-center rounded-sm border border-[#51689A] bg-white shadow-sm dark:border-[#383F58] dark:bg-[#242A40]">
            <FileCheck2
              size={18}
              className="text-[#1B2065F2] dark:text-[#EEF4F7]"
              strokeWidth={1.75}
            />
          </span>
          <p className="text-sm font-semibold sm:text-base">
            {isArabic
              ? "طلبات الغياب"
              : "Professor Absence List"}
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:flex-1 sm:justify-end">
          <div className="relative w-full min-w-0 sm:w-[253px] sm:max-w-[253px]">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={isArabic ? "ابحث..." : "Search..."}
              className="h-[43px] rounded-lg border border-[#51689A]/35 bg-[#FEF9F9] pe-9 ps-3 text-sm text-[#1B2065F2] shadow-sm focus-visible:ring-[#51689A]/40 sm:h-9 dark:border-[#383F58] dark:bg-[#1A2036] dark:text-[#EEF4F7] dark:placeholder:text-[#9BA8C4]"
              disabled={loading}
            />

            <Search
              className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-[#1B2065F2]/70 dark:text-[#9BA8C4]"
              strokeWidth={2}
            />
          </div>
          {hasSelection && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={`${controlBtnClass} text-destructive hover:text-destructive`}
              onClick={() => void handleDeleteSelected()}
              title={isArabic ? "حذف المحدد" : "Delete selected"}
              aria-label={isArabic ? "حذف المحدد" : "Delete selected"}
            >
              <Trash2 size={18} strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[#74A7BD]/30 bg-white/90 dark:border-[#74A7BD]/25 dark:bg-[#1A2036]/90">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-[#51689A]/20 bg-gradient-to-r from-white to-[#F6F8FF] text-[#1B2065F2] dark:border-[#383F58] dark:bg-gradient-to-r dark:from-[#1A2036] dark:to-[#242A40] dark:text-[#EEF4F7]">

                <th className="w-10 min-w-10 border-b border-[#D6DEEF] dark:border-[#383F58] px-2 py-2.5 text-center">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={toggleSelectAllVisible}
                    aria-label={
                      isArabic
                        ? "تحديد الصفحة"
                        : "Select page"
                    }
                    className="appearance-none rounded-full border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white dark:border-[#74A7BD] dark:data-[state=checked]:bg-[#74A7BD]"
                  />
                </th>

                <th className="border-b border-[#D6DEEF] dark:border-[#383F58] px-2 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:text-sm">
                  {isArabic ? "الاسم" : "Name"}
                </th>

                <th className="border-b border-[#D6DEEF] dark:border-[#383F58] px-2 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:text-sm">
                  {isArabic ? "تاريخ الغياب" : "Absence Date"}
                </th>

                <th className="border-b border-[#D6DEEF] dark:border-[#383F58] px-2 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:text-sm">
                  {isArabic ? "الحالة" : "State"}
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row, vIdx) => {
                const stripe = vIdx % 2 === 0;
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-[#D6DEEF] dark:border-[#383F58] text-[#1B2065F2] dark:text-[#EEF4F7] ${
                      stripe
                        ? "bg-gradient-to-r from-white to-[#EEF3FB]/80 dark:bg-gradient-to-r dark:from-[#1A2036] dark:to-[#242A40]/80"
                        : "bg-gradient-to-r from-[#F5F8FD]/90 to-white dark:bg-gradient-to-r dark:from-[#242A40]/90 dark:to-[#1A2036]"
                    }`}
                  >

                    <td className="w-10 min-w-10 px-2 py-2.5 text-center align-middle">
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onCheckedChange={() =>
                          toggleRowSelect(row.id)
                        }
                        aria-label={`${
                          isArabic
                            ? "تحديد"
                            : "Select"
                        } ${row.name}`}
                        className="appearance-none rounded-full border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white dark:border-[#74A7BD] dark:data-[state=checked]:bg-[#74A7BD]"
                      />
                    </td>

                    <td className="min-w-0 max-w-[min(28vw,8rem)] break-words px-2 py-2.5 align-middle sm:max-w-none">
                      <button
                        type="button"
                        onClick={() => handleStateClick(row)}
                        className="font-medium text-[#1B2065F2] underline decoration-[#51689A]/40 underline-offset-2 hover:text-[#51689A] dark:text-[#EEF4F7] dark:hover:text-[#74A7BD]"
                      >
                        {row.name}
                      </button>
                    </td>

                    <td className="px-2 py-2.5 align-middle font-medium text-[#51689A] dark:text-[#74A7BD]">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs">
                          <span className="font-semibold">{isArabic ? "من" : "From"}:</span> {row.startDate}
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold">{isArabic ? "إلى" : "To"}:</span> {row.endDate}
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-2.5 align-middle">
                      <button
                        type="button"
                        onClick={() => handleStateClick(row)}
                        className={`inline-flex cursor-pointer items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition ${getAbsenceStateClasses(row.state)}`}
                      >
                        {row.state}
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && visibleRows.length === 0 && (
          <p className="py-5 text-center text-sm text-[#5D719D] dark:text-[#9BA8C4]">
            {isArabic
              ? "لا توجد نتائج."
              : "No absences found."}
          </p>
        )}
      </div>

      {/* Pagination */}
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
                onClick={(e) => {
                  e.preventDefault();
                  changePage(currentPageSafe - 1);
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
                    onClick={(e) => {
                      e.preventDefault();
                      changePage(item);
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
                className={
                  currentPageSafe === totalPages ? "pointer-events-none opacity-50" : ""
                }
                onClick={(e) => {
                  e.preventDefault();
                  changePage(currentPageSafe + 1);
                }}
              />
            </PaginationItem>

          </PaginationContent>
        </Pagination>
      </div>

      {selectedRow && (
        <ProfAbsencePopUpWindow
          open={isPopupOpen}
          onClose={handlePopupClose}
          onAccept={handlePopupAccept}
          onReject={handlePopupReject}
          absenceDate={selectedRow.startDate}
          absenceCause={selectedRow.absenceCause}
          justificationPdfUrl={selectedRow.justificationImageUrl}
        />
      )}
    </section>
  );
}
