"use client";

import { useEffect, useMemo, useState } from "react";
import { FileCheck2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import {
  loadAllAcademicModules,
  loadAllAcademicYears,
  deleteExtraSessionById,
  loadExtraSessionSchoolingList,
  patchExtraSessionAccept,
  patchExtraSessionRefuse,
  type ExtraSessionRequestRow,
} from "@/lib/checkinClient";
import {
  buildYearNameByIdMap,
  inferDepartmentFromModuleName,
  loadCurrentSchoolingDepartment,
  type AcademicModuleRow,
  type AcademicYearRow,
} from "@/lib/departmentScope";
import { pushRoleNotification } from "@/lib/notificationsApi";
import SessionPopUpWindow from "@/app/_components/admin/sessions/SessionPopUpWindow";

type Semester = "S1" | "S2";

type SessionRequestRow = {
  id: number;
  professorName: string;
  professorEmail: string;
  sessionDate: string;
  yearGroup: string;
  state: string;
  sessionDetails: {
    date: string;
    time: string;
    place: string;
    groups: string;
    semester: Semester;
  };
};

function formatTime(t: string | undefined): string {
  const m = /^(\d{2}):(\d{2})/.exec(String(t ?? ""));
  return m ? `${m[1]}:${m[2]}` : "—";
}

function mapStatus(status: string | undefined): string {
  const s = (status ?? "").toLowerCase();
  if (s === "accepted") return "accepted";
  if (s === "refused") return "rejected";
  return "pending";
}

function mapApiRow(row: ExtraSessionRequestRow): SessionRequestRow {
  const date = row.date ?? "—";
  const start = formatTime(row.start_time);
  const end = formatTime(row.end_time);
  const groups = [row.group_name, row.module_name].filter(Boolean).join(" · ") || "—";
  return {
    id: row.id,
    professorName: row.teacher_name?.trim() || row.teacher_email || "—",
    professorEmail: row.teacher_email ?? "",
    sessionDate: date,
    yearGroup: groups,
    state: mapStatus(row.status),
    sessionDetails: {
      date,
      time: end !== "—" ? `${start} – ${end}` : start,
      place: "—",
      groups,
      semester: "S1",
    },
  };
}

function getSessionStateClasses(state: string) {
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

const PAGE_SIZE = 5;
const controlBtnClass =
  "h-[43px] min-h-[43px] shrink-0 rounded-lg border border-[#51689A]/35 bg-white px-2.5 text-[#1B2065F2] shadow-sm hover:bg-[#FDFDFF] sm:h-9 sm:min-h-0 dark:border-[#383F58] dark:bg-[#1A2036] dark:text-[#EEF4F7] dark:hover:bg-[#242A40]";

export function ProfessorSessionTable() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SessionRequestRow[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionRequestRow | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [raw, modules, years, currentDept] = await Promise.all([
          loadExtraSessionSchoolingList(),
          loadAllAcademicModules() as Promise<AcademicModuleRow[]>,
          loadAllAcademicYears() as Promise<AcademicYearRow[]>,
          loadCurrentSchoolingDepartment(),
        ]);
        const yearNameById = buildYearNameByIdMap(years);
        const scopedRows =
          currentDept == null
            ? raw
            : raw.filter((row) => {
                const dept = inferDepartmentFromModuleName(
                  row.module_name,
                  modules,
                  yearNameById
                );
                // Keep rows we cannot map (avoid hiding valid API requests)
                if (dept === null) return true;
                return dept === currentDept;
              });
        const mapped = scopedRows
          .map(mapApiRow)
          .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
        if (!cancelled) setData(mapped);
      } catch {
        if (!cancelled) {
          toast.error(
            isArabic ? "تعذر تحميل طلبات الحصص." : "Could not load session requests."
          );
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isArabic]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      if (q.length === 0) return true;
      return (
        row.professorName.toLowerCase().includes(q) ||
        row.professorEmail.toLowerCase().includes(q) ||
        row.sessionDate.toLowerCase().includes(q) ||
        row.yearGroup.toLowerCase().includes(q) ||
        row.state.toLowerCase().includes(q)
      );
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

  const toggleRowSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const hasSelection = selectedIds.size > 0;

  const handleDeleteSelected = async () => {
    if (!hasSelection) return;
    const ids = [...selectedIds];
    setLoading(true);
    try {
      for (const id of ids) {
        const res = await deleteExtraSessionById(id);
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t.trim() || `HTTP ${res.status}`);
        }
      }
      setData((prev) => prev.filter((row) => !selectedIds.has(row.id)));
      setSelectedIds(new Set());
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

  const handleStateClick = (row: SessionRequestRow) => {
    if (row.state !== "pending") return;
    setSelectedSession(row);
    setIsPopupOpen(true);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedSession(null);
  };

  const notifySessionDecision = (
    decision: "accepted" | "rejected",
    row: SessionRequestRow
  ) => {
    const details = row.sessionDetails;
    const when = `${details.date} ${details.time}`;
    const groups = details.groups;

    if (decision === "accepted") {
      pushRoleNotification({
        audience: ["prof"],
        title: isArabic ? "تمت الموافقة على الحصة" : "Session approved",
        body: isArabic
          ? `طلبك مقبول (${when}). الشعب: ${groups}. ستظهر الحصة في «حصص اليوم» يومها لفتح سجل الحضور.`
          : `Your request was approved (${when}). Groups: ${groups}. It will appear under today's sessions on that date to open attendance.`,
      });
    } else {
      pushRoleNotification({
        audience: ["prof"],
        title: isArabic ? "تم رفض طلب الحصة" : "Session request declined",
        body: isArabic
          ? `لم تُوافق الشؤون التعليمية على الطلب (${when}).`
          : `Schooling declined the session request (${when}).`,
      });
    }
  };

  const handlePopupAccept = async () => {
    if (!selectedSession) return;
    try {
      const res = await patchExtraSessionAccept(selectedSession.id);
      if (!res.ok) throw new Error(await res.text());
      notifySessionDecision("accepted", selectedSession);
      setData((prev) =>
        prev.map((r) =>
          r.id === selectedSession.id ? { ...r, state: "accepted" } : r
        )
      );
      toast.success(
        isArabic
          ? "تمت الموافقة. أُبلغ الأستاذ؛ الحصة ستظهر في upcoming يومها بعد الموافقة."
          : "Approved. The professor was notified; the session appears in upcoming on that day."
      );
      handlePopupClose();
    } catch {
      toast.error(isArabic ? "تعذر قبول الطلب." : "Could not accept request.");
    }
  };

  const handlePopupReject = async () => {
    if (!selectedSession) return;
    try {
      const res = await patchExtraSessionRefuse(selectedSession.id);
      if (!res.ok) throw new Error(await res.text());
      notifySessionDecision("rejected", selectedSession);
      setData((prev) =>
        prev.map((r) =>
          r.id === selectedSession.id ? { ...r, state: "rejected" } : r
        )
      );
      toast.success(
        isArabic
          ? "تم الرفض. أُبلغ الأستاذ والطلاب."
          : "Declined. The professor and students were notified."
      );
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
            {isArabic ? "طلبات الحصص الإضافية" : "Extra session requests"}
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

      <div className="overflow-hidden rounded-lg border border-[#74A7BD]/30 bg-white/90 dark:border-[#74A7BD]/25 dark:bg-[#1A2036]/90">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-[#51689A]/20 bg-gradient-to-r from-white to-[#F6F8FF] text-[#1B2065F2] dark:border-[#383F58] dark:from-[#1A2036] dark:to-[#242A40] dark:text-[#EEF4F7]">
                <th className="w-10 min-w-10 border-b border-[#D6DEEF] px-2 py-2.5 text-center dark:border-[#383F58]">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={toggleSelectAllVisible}
                    aria-label={isArabic ? "تحديد الصفحة" : "Select page"}
                    className="appearance-none rounded-full border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white dark:border-[#74A7BD] dark:data-[state=checked]:bg-[#74A7BD]"
                  />
                </th>
                <th className="border-b border-[#D6DEEF] px-2 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:text-sm dark:border-[#383F58]">
                  {isArabic ? "الأستاذ" : "Professor"}
                </th>
                <th className="hidden border-b border-[#D6DEEF] px-2 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide md:table-cell sm:text-sm dark:border-[#383F58]">
                  {isArabic ? "البريد" : "Email"}
                </th>
                <th className="border-b border-[#D6DEEF] px-2 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:text-sm dark:border-[#383F58]">
                  {isArabic ? "التاريخ" : "Date"}
                </th>
                <th className="border-b border-[#D6DEEF] px-2 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:text-sm dark:border-[#383F58]">
                  {isArabic ? "المجموعة/المادة" : "Group / Module"}
                </th>
                <th className="border-b border-[#D6DEEF] px-2 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:text-sm dark:border-[#383F58]">
                  {isArabic ? "الحالة" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, vIdx) => {
                const stripe = vIdx % 2 === 0;
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-[#D6DEEF] text-[#1B2065F2] dark:border-[#383F58] dark:text-[#EEF4F7] ${
                      stripe
                        ? "bg-gradient-to-r from-white to-[#EEF3FB]/80 dark:from-[#1A2036] dark:to-[#242A40]/80"
                        : "bg-gradient-to-r from-[#F5F8FD]/90 to-white dark:from-[#242A40]/90 dark:to-[#1A2036]"
                    }`}
                  >
                    <td className="w-10 min-w-10 px-2 py-2.5 text-center align-middle">
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onCheckedChange={() => toggleRowSelect(row.id)}
                        aria-label={`${isArabic ? "تحديد" : "Select"} ${row.professorName}`}
                        className="appearance-none rounded-full border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white dark:border-[#74A7BD] dark:data-[state=checked]:bg-[#74A7BD]"
                      />
                    </td>
                    <td className="min-w-0 px-2 py-2.5 align-middle font-medium">
                      {row.professorName}
                    </td>
                    <td className="hidden min-w-0 px-2 py-2.5 align-middle md:table-cell">
                      {row.professorEmail ? (
                        <a
                          href={`mailto:${row.professorEmail}`}
                          className="break-all text-[#51689A] underline decoration-[#51689A] underline-offset-2 hover:text-[#3d5280] dark:text-[#74A7BD]"
                        >
                          {row.professorEmail}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-2 py-2.5 align-middle text-[#51689A] dark:text-[#74A7BD]">
                      {row.sessionDate}
                    </td>
                    <td className="px-2 py-2.5 align-middle font-medium text-[#6CB4B4]">
                      {row.yearGroup}
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      <button
                        type="button"
                        disabled={row.state !== "pending"}
                        onClick={() => handleStateClick(row)}
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition ${getSessionStateClasses(row.state)} ${
                          row.state === "pending"
                            ? "cursor-pointer hover:opacity-90"
                            : "cursor-default"
                        }`}
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
            {isArabic ? "لا توجد طلبات." : "No session requests found."}
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
                className={`text-[#5D719D] hover:bg-[#F6F7FE] dark:text-[#9BA8C4] dark:hover:bg-[#242A40] ${currentPageSafe === 1 ? "pointer-events-none opacity-50" : ""}`}
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
                    className={
                      item === currentPageSafe
                        ? "border-[#51689A] bg-[#F6F7FE] text-[#1B2065] dark:border-[#74A7BD] dark:bg-[#242A40] dark:text-[#EEF4F7]"
                        : "text-[#5D719D] hover:bg-[#F6F7FE] dark:text-[#9BA8C4] dark:hover:bg-[#242A40]"
                    }
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
                className={`text-[#5D719D] hover:bg-[#F6F7FE] dark:text-[#9BA8C4] dark:hover:bg-[#242A40] ${
                  currentPageSafe === totalPages ? "pointer-events-none opacity-50" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  changePage(currentPageSafe + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {selectedSession ? (
        <SessionPopUpWindow
          open={isPopupOpen}
          onClose={handlePopupClose}
          onAccept={() => void handlePopupAccept()}
          onReject={() => void handlePopupReject()}
          session={selectedSession.sessionDetails}
        />
      ) : null}
    </section>
  );
}
