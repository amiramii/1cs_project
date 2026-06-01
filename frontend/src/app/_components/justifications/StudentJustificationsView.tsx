"use client";

import { useEffect, useMemo, useState } from "react";
import { BookA } from "lucide-react";
import { toast } from "sonner";

import { useLanguage } from "@/app/_components/language-provider";
import { loadStudentJustificationsList } from "@/lib/checkinClient";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

/** Matches `studentJustificationOutbox` shape for badges / rows. */
import type {
  JustificationState,
  StudentJustificationRow,
} from "@/lib/studentJustificationOutbox";

const PAGE_SIZE = 6;

type ApiAttendanceMini = {
  id?: number;
  module?: string;
  date?: string;
};

type RawJustification = {
  id?: number;
  status?: string;
  attendances?: ApiAttendanceMini[];
  created_at?: string;
};

function isoDateOnly(dateStr: string | undefined): string {
  if (!dateStr) return "";
  if (dateStr.includes("T")) return dateStr.slice(0, 10);
  return dateStr.slice(0, 10);
}

function formatShortDate(dateKey: string, isAr: boolean): string {
  const [y, m, day] = dateKey.split("-").map((x) => Number(x));
  if (!y || !m || !day) return dateKey;
  const dt = new Date(Date.UTC(y, m - 1, day));
  return new Intl.DateTimeFormat(isAr ? "ar-DZ" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dt);
}

function apiStatusToState(status: unknown): JustificationState {
  if (status === "accepted") return "accepted";
  if (status === "refused") return "rejected";
  return "pending";
}

function justificationRowsFromApi(
  list: RawJustification[],
  isAr: boolean
): StudentJustificationRow[] {
  const rows: StudentJustificationRow[] = [];
  const createdFallback = Date.now();

  for (const j of list) {
    const jid = typeof j.id === "number" ? j.id : 0;
    const state = apiStatusToState(j.status);
    const submitted =
      typeof j.created_at === "string" ? j.created_at : new Date(createdFallback).toISOString();

    const atts = Array.isArray(j.attendances) ? j.attendances : [];

    if (atts.length === 0) {
      rows.push({
        id: `${jid}-fallback`,
        justificationDate: "—",
        module: "—",
        state,
        submittedAt: submitted,
      });
      continue;
    }

    let i = 0;
    for (const a of atts) {
      const dk = isoDateOnly(typeof a.date === "string" ? a.date : undefined);
      rows.push({
        id: `${jid}-a-${a.id ?? i}`,
        justificationDate:
          dk !== "" ? formatShortDate(dk, isAr) : "—",
        module:
          typeof a.module === "string" && a.module.trim()
            ? a.module.trim()
            : "—",
        state,
        submittedAt: submitted,
      });
      i += 1;
    }
  }

  rows.sort((a, b) => {
    const tb =
      typeof b.submittedAt === "string"
        ? new Date(b.submittedAt).getTime()
        : 0;
    const ta =
      typeof a.submittedAt === "string"
        ? new Date(a.submittedAt).getTime()
        : 0;
    return tb - ta || a.justificationDate.localeCompare(b.justificationDate);
  });

  return rows;
}

function isNonEmptyRow(r: StudentJustificationRow): boolean {
  return Boolean(r.justificationDate?.trim() || r.module?.trim());
}

function stateBadge(
  state: JustificationState,
  isAr: boolean
): { className: string; label: string } {
  switch (state) {
    case "rejected":
      return {
        className:
          "border border-[#DF2D3EF2] bg-[#FFD1D5F2] font-semibold text-[#DF2D3EF2]",
        label: isAr ? "مرفوض" : "rejected",
      };
    case "accepted":
      return {
        className:
          "border border-[#74A7BD] bg-[#EEFAFF] font-semibold text-[#74A7BD]",
        label: isAr ? "مقبول" : "Accepted",
      };
    default:
      return {
        className:
          "border border-[#C4A820] bg-[#FFF5C3F2]/80 font-semibold text-[#9A7B0A] dark:border-[#FFD54F]/55 dark:bg-[#3A3420] dark:text-[#FFD54F]",
        label: isAr ? "قيد المراجعة" : "Pending",
      };
  }
}

export default function StudentJustificationsView() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [sortedRows, setSortedRows] = useState<StudentJustificationRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const raw = (await loadStudentJustificationsList()) as RawJustification[];
        if (!cancelled) {
          const rows = justificationRowsFromApi(
            raw,
            isAr
          ).filter(isNonEmptyRow);
          setSortedRows(rows);
        }
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : isAr ? "تعذر التحميل." : "Could not load.";
        toast.error(msg);
        if (!cancelled) setSortedRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAr]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedRows.length / PAGE_SIZE)
  );
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStart = (currentPageSafe - 1) * PAGE_SIZE;
  const pageRows = sortedRows.slice(pageStart, pageStart + PAGE_SIZE);

  const pageItems = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const items: number[] = [1];
    if (currentPageSafe > 3) items.push(-1);
    const start = Math.max(2, currentPageSafe - 1);
    const end = Math.min(totalPages - 1, currentPageSafe + 1);
    for (let page = start; page <= end; page += 1) items.push(page);
    if (currentPageSafe < totalPages - 2) items.push(-2);
    items.push(totalPages);
    return items;
  }, [currentPageSafe, totalPages]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-[#1B2065] md:text-3xl dark:text-[#EEF4F7]">
          {isAr ? "مبرراتك" : "Your Justifications"}
        </h1>
        <p className="text-[15px] text-[#51689A] dark:text-[#9BA8C4]">
          {isAr
            ? "حالة مبررات غيابك المقدّمة."
            : "Status of your submitted absence justifications."}
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">{isAr ? "جاري التحميل…" : "Loading…"}</p>
      ) : null}

      <section
        className="overflow-hidden rounded-2xl border border-[#51689A]/25 bg-white shadow-sm dark:border-[#383F58] dark:bg-[#1A2036]"
        aria-labelledby="justification-list-heading"
      >
        <div className="flex items-center gap-2 border-b border-[#51689A]/15 bg-[#F6F7FE] px-4 dark:border-[#383F58] dark:bg-[#242A40] py-4 sm:px-8">
          <BookA className="size-5 shrink-0 text-[#1B2065] dark:text-[#EEF4F7]" aria-hidden />
          <h2
            id="justification-list-heading"
            className="text-base font-semibold tracking-tight text-[#1B2065] dark:text-[#EEF4F7]"
          >
            {isAr ? "قائمة المبررات" : "Justification list"}
          </h2>
        </div>

        <div className="overflow-x-auto ">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#51689A] text-white dark:bg-[#242A40] dark:text-[#EEF4F7]">
                <th className="px-10 py-3 text-center font-semibold">
                  {isAr ? "تاريخ الغياب" : "Absent date"}
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  {isAr ? "المادة" : "Module"}
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  {isAr ? "الحالة" : "State"}
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-sm text-[#51689A] dark:text-[#9BA8C4]"
                  >
                    {loading
                      ? isAr ? "جاري التحميل…" : "Loading…"
                      : isAr
                        ? "لا توجد مبررات."
                        : "No justifications yet."}
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => {
                  const b = stateBadge(row.state, isAr);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-[#51689A]/10 last:border-b-0 dark:border-[#383F58]"
                    >
                      <td className="px-10 py-4 text-center font-medium tabular-nums text-[#1B2065] dark:text-[#EEF4F7]">
                        {row.justificationDate}
                      </td>
                      <td className="px-10 py-4 text-center font-medium text-[#1B2065] dark:text-[#EEF4F7]">
                        {row.module}
                      </td>
                      <td className="px-10 py-4 text-center">
                        <span
                          className={cn(
                            "inline-flex min-w-[6rem] justify-center rounded-full px-3 py-1 text-xs",
                            b.className
                          )}
                        >
                          {b.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {sortedRows.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-2 border-t border-[#51689A]/15 bg-[#F6F7FE] px-3 dark:border-[#383F58] dark:bg-[#242A40] py-2 sm:flex-row sm:px-4">
            <p className="text-xs text-[#51689A] dark:text-[#9BA8C4]">
              {isAr
                ? `الصفحة ${currentPageSafe} من ${totalPages}`
                : `Page ${currentPageSafe} of ${totalPages}`}
            </p>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    text={isAr ? "السابق" : "Previous"}
                    className={
                      currentPageSafe === 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    onClick={(event) => {
                      event.preventDefault();
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
                        onClick={(event) => {
                          event.preventDefault();
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
                    text={isAr ? "التالي" : "Next"}
                    className={
                      currentPageSafe === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      changePage(currentPageSafe + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </section>
    </div>
  );
}
