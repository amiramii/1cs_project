"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Funnel,
  Search,
  Check,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { loadAllJustificationsSchooling } from "@/lib/checkinClient";
import SessionPopUpWindow from "@/app/_components/admin/sessions/SessionPopUpWindow";

type Semester = "S1" | "S2";

type JustificationRow = {
  id: string;
  name: string;
  email: string;
  sessionDate: string;
  yearGroup: string;
  state: string;
  sessionDetails?: {
    date: string;
    time: string;
    place: string;
    groups: string;
    semester: Semester;
  };
};

type RawJustificationRow = {
  student_name?: string;
  student_email?: string;
  session_date?: string;
  year_group?: string;
  state?: string;
  session_time?: string;
  session_place?: string;
  session_groups?: string;
  session_semester?: string;
};

function validateSemester(value: string | undefined): Semester {
  if (value === "S1" || value === "S2") {
    return value;
  }
  return "S1"; // Default to S1
}

function aggregateByStudent(rows: RawJustificationRow[]): JustificationRow[] {
  return rows
    .map((j) => {
      const email = typeof j.student_email === "string" ? j.student_email.trim() : "";
      const name =
        typeof j.student_name === "string" && j.student_name.trim()
          ? j.student_name.trim()
          : email;
      const sessionDate =
        typeof j.session_date === "string" && j.session_date.trim()
          ? j.session_date.trim()
          : "—";
      const yearGroup =
        typeof j.year_group === "string" && j.year_group.trim()
          ? j.year_group.trim()
          : "—";
      const state =
        typeof j.state === "string" && j.state.trim()
          ? j.state.trim()
          : "—";

      const sessionDetails = {
        date: sessionDate || "—",
        time: typeof j.session_time === "string" && j.session_time.trim() ? j.session_time.trim() : "—",
        place: typeof j.session_place === "string" && j.session_place.trim() ? j.session_place.trim() : "—",
        groups: yearGroup || "—",
        semester: validateSemester(j.session_semester),
      };

      return {
        id: email,
        name,
        email,
        sessionDate,
        yearGroup,
        state,
        sessionDetails,
      };
    })
    .filter((row) => row.email)
    .sort((a, b) => a.name.localeCompare(b.name));
}

const controlBtnClass =
  "h-[43px] min-h-[43px] shrink-0 rounded-lg border border-[#51689A]/35 bg-white px-2.5 text-[#1B2065F2] shadow-sm hover:bg-[#FDFDFF] sm:h-9 sm:min-h-0";

const PAGE_SIZE = 5;

export function ProfessorSessionTable({
  studentDetailHrefMode = "schoolingMock",
}: {
  /** Schooling uses the mock detail page; admins use the API-backed review screen. */
  studentDetailHrefMode?: "schoolingMock" | "backendReview"
} = {}) {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const studentDetailBase =
    studentDetailHrefMode === "backendReview"
      ? "/Justifications/Justification-details/live"
      : "/Justifications/Justification-details";

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<JustificationRow[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<JustificationRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const raw =
          (await loadAllJustificationsSchooling()) as RawJustificationRow[];
        const agg = aggregateByStudent(raw);
        if (!cancelled) setData(agg);
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
  }, [isArabic]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesSearch =
        q.length === 0 ||
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.sessionDate.toLowerCase().includes(q) ||
        row.yearGroup.toLowerCase().includes(q) ||
        row.state.toLowerCase().includes(q);
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
    setSelectedSession(row);
    setIsPopupOpen(true);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedSession(null);
  };

  const handlePopupAccept = (year: string) => {
    console.log("Accepted with year:", year);
    handlePopupClose();
  };

  const handlePopupReject = () => {
    console.log("Rejected");
    handlePopupClose();
  };

  return (
    <section className="mx-auto w-full min-w-0 max-w-full space-y-3 overflow-x-hidden rounded-xl border border-[#51689A]/30 bg-[#F6F7FE]/40 p-4 shadow-sm">
      {loading ? (
        <p className="text-sm text-[#51689AF2]">
          {isArabic ? "جاري التحميل…" : "Loading…"}
        </p>
      ) : null}
      {/* Header bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#74A7BD]/30 bg-[#F6F7FE] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[#1B2065F2]">
          <span className="flex h-fit w-fit items-center justify-center rounded-sm border border-[#51689A] bg-white shadow-sm">
            <FileCheck2
              size={18}
              className="text-[#1B2065F2]"
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
              className="h-[43px] rounded-lg border border-[#51689A]/35 bg-[#FEF9F9] pe-9 ps-3 text-sm text-[#1B2065F2] shadow-sm focus-visible:ring-[#51689A]/40 sm:h-9"
              disabled={loading}
            />

            <Search
              className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-[#1B2065F2]/70"
              strokeWidth={2}
            />
          </div>


        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[#74A7BD]/30 bg-white/90">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-[#51689A]/20 bg-gradient-to-r from-white to-[#F6F8FF] text-[#1B2065F2]">

                <th className="w-10 min-w-10 border-b border-[#D6DEEF] px-2 py-2.5 text-center">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={toggleSelectAllVisible}
                    aria-label={
                      isArabic
                        ? "تحديد الصفحة"
                        : "Select page"
                    }
                    className="appearance-none rounded-full border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white"
                  />
                </th>

                <th className="border-b border-[#D6DEEF] px-2 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:text-sm">
                  {isArabic ? "الاسم" : "Name"}
                </th>

                <th className="hidden border-b border-[#D6DEEF] px-2 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide md:table-cell sm:text-sm">
                  {isArabic
                    ? "البريد"
                    : "Email Address"}
                </th>

                <th className="border-b border-[#D6DEEF] px-2 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:text-sm">
                  {isArabic ? "تاريخ الجلسة" : "Session Date"}
                </th>

                <th className="border-b border-[#D6DEEF] px-2 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:text-sm">
                  {isArabic ? "السنة/المجموعة" : "Year/Group"}
                </th>

                <th className="border-b border-[#D6DEEF] px-2 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide sm:text-sm">
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
                    className={`border-b border-[#D6DEEF] text-[#1B2065F2] ${
                      stripe
                        ? "bg-gradient-to-r from-white to-[#EEF3FB]/80"
                        : "bg-gradient-to-r from-[#F5F8FD]/90 to-white"
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
                        className="appearance-none rounded-full border-[#51689A] data-[state=checked]:bg-[#51689A] data-[state=checked]:text-white"
                      />
                    </td>

                    <td className="min-w-0 max-w-[min(28vw,8rem)] break-words px-2 py-2.5 align-middle sm:max-w-none">
                      <Link
                        href={`${studentDetailBase}?student=${encodeURIComponent(row.email)}`}
                        className="font-medium text-[#1B2065F2] underline decoration-[#51689A]/40 underline-offset-2 hover:text-[#51689A] hover:decoration-[#51689A]"
                      >
                        {row.name}
                      </Link>
                    </td>

                    <td className="hidden min-w-0 px-2 py-2.5 align-middle md:table-cell">
                      <a
                        href={`mailto:${row.email}`}
                        className="break-all text-[#51689A] underline decoration-[#51689A] underline-offset-2 visited:text-[#51689A] hover:text-[#3d5280]"
                      >
                        {row.email}
                      </a>
                    </td>

                    <td className="px-2 py-2.5 align-middle text-[#51689A]">
                      {row.sessionDate}
                    </td>

                    <td className="px-2 py-2.5 align-middle font-medium text-[#6CB4B4]">
                      {row.yearGroup}
                    </td>

                    <td className="px-2 py-2.5 align-middle">
                      <button
                        onClick={() => handleStateClick(row)}
                        className="inline-flex cursor-pointer items-center rounded-full bg-[#1B2065]/10 px-2.5 py-0.5 text-xs font-semibold text-[#1B2065F2] transition-colors hover:bg-[#1B2065]/20"
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
          <p className="py-5 text-center text-sm text-[#5D719D]">
            {isArabic
              ? "لا توجد نتائج."
              : "No sessions found."}
          </p>
        )}
      </div>

      {/* Pagination */}
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

      {selectedSession && selectedSession.sessionDetails && (
        <SessionPopUpWindow
          open={isPopupOpen}
          onClose={handlePopupClose}
          onAccept={handlePopupAccept}
          onReject={handlePopupReject}
          session={selectedSession.sessionDetails}
        />
      )}
    </section>
  );
}
