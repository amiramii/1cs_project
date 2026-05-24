"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, BookA, Search, Funnel } from "lucide-react";
import { toast } from "sonner";

import { useLanguage } from "@/app/_components/language-provider";
import JustifyAbsenceDialog from "@/app/_components/absences/JustifyAbsenceDialog";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchStudentAbsencesByDate,
  fetchStudentAbsencesByModule,
  loadStudentJustificationsList,
} from "@/lib/checkinClient";
import { cn } from "@/lib/utils";

type AbsenceRow = {
  id: string;
  module: string;
  absenceCount: number;
  justificationCount: number;
  excluded: boolean;
};

type AbsenceDayCard = {
  id: string;
  dateLabel: string;
  slots: {
    module: string;
    time: string;
    attendanceId: number;
  }[];
};

type ByModuleApiEntry = {
  session__assignment__module__name?: string;
  absence_count?: number;
};

type AttendanceByDateApiEntry = {
  id: number;
  module?: string;
  date?: string;
  start_time?: string | null;
  end_time?: string | null;
};

type RawJustification = {
  attendances?: { module?: string }[];
};

const HIGH_ABSENCE_THRESHOLD = 4;

const PAGE_SIZE = 6;

type ExclusionFilter = "all" | "excluded" | "nonExcluded";

function normalizeModule(name: unknown): string {
  return typeof name === "string" ? name.trim() : "";
}

/** `YYYY-MM-DD` from backend date string */
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

function formatClock(t?: string | null): string {
  if (!t) return "";
  const [h, mi] = t.split(":");
  if (h === undefined || mi === undefined) return t;
  return `${h}:${mi.slice(0, 2)}`;
}

function justificationRequestsTouchingModule(
  list: RawJustification[],
  moduleName: string
): number {
  const target = normalizeModule(moduleName).toLowerCase();
  let n = 0;
  for (const j of list) {
    const atts = j.attendances ?? [];
    if (
      atts.some(
        (a) => normalizeModule(a.module).toLowerCase() === target && target
      )
    ) {
      n += 1;
    }
  }
  return n;
}

function absenceCountColor(count: number, excluded: boolean) {
  if (excluded || count >= HIGH_ABSENCE_THRESHOLD) return "#DF2D3EF2";
  if (count >= 3) return "#E7CE51F2";
  return "#74A7BDF2";
}

function buildDayCards(
  attendanceRows: AttendanceByDateApiEntry[],
  isAr: boolean
): AbsenceDayCard[] {
  const map = new Map<
    string,
    { slots: AbsenceDayCard["slots"]; sortKey: string }
  >();
  for (const row of attendanceRows) {
    const key = isoDateOnly(row.date);
    if (!key) continue;
    const time =
      row.start_time && row.end_time
        ? `${formatClock(row.start_time)}–${formatClock(row.end_time)}`
        : formatClock(row.start_time) ||
          formatClock(row.end_time) ||
          "—";
    const prev = map.get(key);
    const slot = {
      module: normalizeModule(row.module) || "—",
      time,
      attendanceId: row.id,
    };
    if (prev) prev.slots.push(slot);
    else map.set(key, { slots: [slot], sortKey: key });
  }

  const out: AbsenceDayCard[] = [];
  for (const [dateKey, { slots }] of map) {
    out.push({
      id: dateKey,
      dateLabel: formatShortDate(dateKey, isAr),
      slots: slots.sort((a, b) => a.module.localeCompare(b.module)),
    });
  }

  out.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  return out;
}

export default function StudentAbsencesView() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<ExclusionFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDayIds, setSelectedDayIds] = useState<Set<string>>(new Set());
  const [justifyOpen, setJustifyOpen] = useState(false);

  const [moduleRows, setModuleRows] = useState<AbsenceRow[]>([]);
  const [dayCards, setDayCards] = useState<AbsenceDayCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadNonce, setLoadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [modRes, dateRes] = await Promise.all([
          fetchStudentAbsencesByModule(),
          fetchStudentAbsencesByDate(),
        ]);
        let justifications = [] as RawJustification[];

        try {
          justifications = (await loadStudentJustificationsList()) as RawJustification[];
        } catch {
          justifications = [];
        }

        if (!modRes.ok) {
          const t = await modRes.text().catch(() => "");
          throw new Error(
            t.trim() || `${isAr ? "تعذر تحميل ملخص المواد." : "Module summary failed."} (${modRes.status})`
          );
        }
        if (!dateRes.ok) {
          const t = await dateRes.text().catch(() => "");
          throw new Error(
            t.trim() || `${isAr ? "تعذر تحميل تواريخ الغياب." : "Absence dates failed."} (${dateRes.status})`
          );
        }

        const rawMod = (await modRes.json()) as unknown;
        const rawDate = (await dateRes.json()) as unknown;
        const modList = Array.isArray(rawMod) ? rawMod : [];
        const dateList = Array.isArray(rawDate) ? rawDate : [];

        const nextRows: AbsenceRow[] = modList.map(
          (entry: unknown, idx: number) => {
            const row = entry as ByModuleApiEntry;
            const module =
              normalizeModule(row.session__assignment__module__name) || "—";
            const absenceCount =
              typeof row.absence_count === "number"
                ? row.absence_count
                : Number(row.absence_count) || 0;
            const excluded = absenceCount >= HIGH_ABSENCE_THRESHOLD;
            const justificationCount = justificationRequestsTouchingModule(
              justifications,
              module
            );
            return {
              id: `m-${module}-${idx}`,
              module,
              absenceCount,
              justificationCount,
              excluded,
            };
          }
        );

        nextRows.sort((a, b) =>
          b.absenceCount !== a.absenceCount
            ? b.absenceCount - a.absenceCount
            : a.module.localeCompare(b.module)
        );

        const typedDate = dateList as AttendanceByDateApiEntry[];
        const cards = buildDayCards(typedDate, isAr);

        if (!cancelled) {
          setModuleRows(nextRows);
          setDayCards(cards);
        }
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : isAr
              ? "تعذر تحميل غياباتك."
              : "Could not load absences.";
        toast.error(msg);
        if (!cancelled) {
          setModuleRows([]);
          setDayCards([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAr, loadNonce]);

  const filteredRows = useMemo(() => {
    let rows = moduleRows;
    if (stateFilter === "excluded") {
      rows = rows.filter((r) => r.excluded);
    } else if (stateFilter === "nonExcluded") {
      rows = rows.filter((r) => !r.excluded);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => r.module.toLowerCase().includes(q));
    }
    return rows;
  }, [query, stateFilter, moduleRows]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / PAGE_SIZE)
  );
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStart = (currentPageSafe - 1) * PAGE_SIZE;
  const pageRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE);

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

  const toggleDay = (id: string) => {
    setSelectedDayIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedDays = dayCards
    .filter((d) => selectedDayIds.has(d.id))
    .map((d) => ({
      id: d.id,
      dateLabel: d.dateLabel,
      slots: d.slots,
    }));

  const refetchLists = () => setLoadNonce((n) => n + 1);

  return (
    <div className="w-full max-w-5xl space-y-10 pb-12">
      <header className="space-y-2 ">
        <h1 className="text-2xl font-bold tracking-tight text-[#1B2065] md:text-3xl">
          {isAr ? "غياباتك" : "Your Absences"}
        </h1>
        <p className="text-[15px] text-[#51689A]">
          {isAr
            ? "اطّلع على غياباتك حسب كل مادة (من الخادم)."
            : "absence counts per module from the attendance API"}
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-[#51689A]">{isAr ? "جاري التحميل…" : "Loading…"}</p>
      ) : null}

      <section
        className="overflow-hidden rounded-2xl border border-[#51689A]/25 bg-white shadow-sm"
        aria-labelledby="absence-list-heading"
      >
        <div className="flex flex-col gap-3 border-b border-[#51689A]/15 bg-[#F6F7FE] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ">
            <div className="flex items-center gap-2 text-[#1B2065]">
              <BookA className="size-5 shrink-0 opacity-90" aria-hidden />
              <h2
                id="absence-list-heading"
                className="text-base font-semibold tracking-tight"
              >
                {isAr ? "قائمة الغياب" : "Absence list"}
              </h2>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center sm:justify-end ">
              <div className="relative w-full shrink-0 sm:w-[200px]">
                <Funnel
                  className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Select
                  value={stateFilter}
                  onValueChange={(v) => {
                    setStateFilter(v as ExclusionFilter);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger
                    className="h-10 w-full rounded-xl border border-slate-200/80 bg-[#FEF9F9] ps-9 pe-2 text-sm font-medium text-[#1B2065] shadow-sm"
                    aria-label={
                      isAr ? "تصفية حسب الاستبعاد" : "Filter by exclusion state"
                    }
                  >
                    <SelectValue
                      placeholder={isAr ? "الحالة" : "State"}
                    />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="min-w-[var(--radix-select-trigger-width)] border border-slate-200/40 bg-popover/75 shadow-lg backdrop-blur-xl dark:border-border/50 dark:bg-popover/70"
                  >
                    <SelectGroup>
                      <SelectLabel className="px-2 font-semibold text-[#1B2065]">
                        {isAr ? "الحالة" : "State"}
                      </SelectLabel>
                      <SelectItem value="all">
                        {isAr ? "الكل" : "All"}
                      </SelectItem>
                      <SelectItem value="excluded">
                        {isAr ? "مرتفع" : "High (≥4)"}
                      </SelectItem>
                      <SelectItem value="nonExcluded">
                        {isAr ? "أقل" : "Below threshold"}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-full sm:min-w-[200px] sm:flex-1 sm:max-w-xs bg-[#FEF9F9]">
                <Search
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[#51689A]/70 bg-[#FEF9F9] "
                  aria-hidden
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={isAr ? "بحث…" : "Search..."}
                  className="h-10 rounded-xl border-[#51689A]/25 bg-[#FEF9F9] ps-9 shadow-none"
                  aria-label={isAr ? "بحث في القائمة" : "Search absence list"}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#51689A] text-white">
                <th className="px-4 py-3 text-start font-semibold">
                  {isAr ? "المادة" : "Module"}
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  {isAr ? "عدد الغيابات" : "Number of Absences"}
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  {isAr ? "مبررات مرتبطة" : "Related justifications"}
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
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-[#51689A]"
                  >
                    {loading
                      ? isAr ? "جاري التحميل…" : "Loading…"
                      : isAr
                        ? "لا توجد نتائج."
                        : "No matching rows."}
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#51689A]/10 last:border-b-0"
                  >
                    <td className="px-4 py-4 text-start text-[#1B2065]">
                      {row.module}
                    </td>
                    <td
                      className="px-4 py-4 text-center font-semibold tabular-nums"
                      style={{
                        color: absenceCountColor(
                          row.absenceCount,
                          row.excluded
                        ),
                      }}
                    >
                      {row.absenceCount}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold tabular-nums text-[#51689A]">
                      {row.justificationCount}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {row.excluded ? (
                        <span className="inline-flex min-w-[5.5rem] justify-center rounded-full border border-[#DF2D3EF2] bg-[#FFD1D5F2] px-3 py-1 text-xs font-semibold text-[#DF2D3EF2]">
                          {isAr ? "مرتفع" : "High"}
                        </span>
                      ) : (
                        <span className="inline-flex min-w-[5.5rem] justify-center rounded-full border border-[#74A7BD] bg-[#EEFAFF] px-3 py-1 text-xs font-semibold text-[#74A7BD]">
                          {isAr ? "معتاد" : "Normal"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredRows.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-2 border-t border-[#51689A]/15 bg-[#F6F7FE] px-3 py-2 sm:flex-row sm:px-4 ">
            <p className="text-xs text-[#51689A]">
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

      <section className="space-y-5">
        <header className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-[#1B2065] md:text-2xl">
            {isAr ? "تواريخ غيابك" : "Your Absence Dates"}
          </h2>
          <p className="text-[15px] text-[#51689A]">
            {isAr
              ? "راجع تواريخ الغياب، ثم اختر اليوم وأرسل طلبًا للشؤون عبر الواجهة."
              : "Select dates (absent slots from the API), then justify with file upload."}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dayCards.map((day) => {
            const selected = selectedDayIds.has(day.id);
            return (
              <article
                key={day.id}
                className="overflow-hidden rounded-2xl border border-[#51689A]/20 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 bg-[#51689A] px-4 py-3 text-white">
                  <span className="w-full text-center font-semibold tabular-nums">
                    {day.dateLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-white transition-colors",
                      selected && "bg-white"
                    )}
                    aria-pressed={selected}
                    aria-label={
                      isAr
                        ? selected
                          ? "إلغاء اختيار التاريخ"
                          : "اختيار التاريخ"
                        : selected
                          ? "Deselect date"
                          : "Select date"
                    }
                  >
                    {selected ? (
                      <Check className="size-3.5 text-[#1B2065]" strokeWidth={3} />
                    ) : null}
                  </button>
                </div>
                <div className="divide-y divide-[#51689A]/12">
                  {day.slots.map((slot) => (
                    <div
                      key={`${day.id}-${slot.attendanceId}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <span className="min-w-0 font-medium text-[#1B2065]">
                        {slot.module}
                      </span>
                      <span className="shrink-0 tabular-nums text-[#51689A]">
                        {slot.time}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        {!loading && dayCards.length === 0 ? (
          <p className="text-sm text-[#51689A]">
            {isAr
              ? "لا توجد سجلات غياب لمختارها من الخادم."
              : "No absent attendance rows returned for your account."}
          </p>
        ) : null}

        <div className="flex justify-center pt-2">
          <Button
            type="button"
            disabled={loading || selectedDays.length === 0}
            onClick={() => setJustifyOpen(true)}
            className="h-12 min-w-[200px] rounded-xl bg-[#1B2065] px-10 text-base font-semibold text-white shadow-md hover:bg-[#1B2065]/90 disabled:opacity-50"
          >
            {isAr ? "تبرير" : "Justify"}
          </Button>
        </div>
      </section>

      <JustifyAbsenceDialog
        open={justifyOpen}
        onOpenChange={setJustifyOpen}
        selectedDays={selectedDays}
        isAr={isAr}
        onSubmitted={() => {
          setSelectedDayIds(new Set());
          refetchLists();
        }}
      />
    </div>
  );
}
