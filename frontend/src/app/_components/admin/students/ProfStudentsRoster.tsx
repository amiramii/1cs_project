"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Funnel, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { useLanguage } from "@/app/_components/language-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { checkinPath } from "@/lib/checkinApi";
import { loadAllAcademicSections, loadAllAcademicYears } from "@/lib/checkinClient";
import { getApiBaseUrl } from "@/lib/apiBase";
import { loadDrfListAll } from "@/lib/drfPaginatedList";
import { getAccessToken, getStoredUserEmail } from "@/lib/tokenStorage";

type ApiStudentRow = {
  id?: number;
  user_id?: string | number;
  full_name?: string;
  email?: string;
  year?: number;
  section?: number;
  group?: number;
};

type TeacherRow = {
  id: number;
  email?: string;
  assignments?: RawTa[];
};

type RawTa = {
  id: number;
  teacher?: number;
  group?: number;
  module?: number;
};

function normEmail(e: string | null | undefined): string {
  return (e ?? "").trim().toLowerCase();
}

function mergeTas(fromEndpoint: RawTa[], teacher?: TeacherRow | null): RawTa[] {
  const byId = new Map<number, RawTa>();
  for (const ta of fromEndpoint) {
    if (typeof ta?.id === "number") byId.set(ta.id, ta);
  }
  const embedded = teacher?.assignments;
  if (teacher && Array.isArray(embedded)) {
    for (const ta of embedded) {
      if (!ta || typeof ta.id !== "number") continue;
      if (byId.has(ta.id)) continue;
      if (typeof ta.group !== "number" || typeof ta.module !== "number") continue;
      byId.set(ta.id, {
        id: ta.id,
        teacher: typeof ta.teacher === "number" ? ta.teacher : teacher.id,
        group: ta.group,
        module: ta.module,
      });
    }
  }
  return [...byId.values()];
}

type DisplayRow = {
  id: string;
  name: string;
  email: string;
  year: string;
  section: string;
  group: string;
};

const PAGE_SIZE = 8;

const controlBtnClass =
  "h-[43px] min-h-[43px] shrink-0 rounded-lg border border-[#51689A]/35 bg-white px-2.5 text-[#1B2065F2] shadow-sm hover:bg-[#FDFDFF] sm:h-9 sm:min-h-0";

function collectYears(rows: DisplayRow[]) {
  return Array.from(new Set(rows.map((r) => r.year))).sort();
}

export default function ProfStudentsRoster() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DisplayRow[]>([]);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [openFilter, setOpenFilter] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const token = getAccessToken();
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    const base = getApiBaseUrl();
    const stored = normEmail(getStoredUserEmail());

    try {
      const [rawStudents, years, sections, groups, rawTas, teachers] =
        await Promise.all([
          loadDrfListAll<ApiStudentRow>(
            base,
            `${checkinPath.students}/`,
            headers,
            {}
          ),
          loadAllAcademicYears() as Promise<{ id: number; name: string }[]>,
          loadAllAcademicSections() as Promise<{ id: number; name: string }[]>,
          loadDrfListAll<{ id: number; name: string }>(
            base,
            `${checkinPath.academic.groups}/`,
            headers,
            {}
          ),
          loadDrfListAll<RawTa>(
            base,
            `${checkinPath.academic.teachingAssignments}/`,
            headers,
            {}
          ),
          loadDrfListAll<TeacherRow>(
            base,
            `${checkinPath.teachers}/`,
            headers,
            {}
          ),
        ]);

      const yMap = new Map(years.map((y) => [y.id, y.name]));
      const secMap = new Map(sections.map((s) => [s.id, s.name]));
      const gMap = new Map(groups.map((g) => [g.id, g.name]));

      const teacherRow = stored
        ? teachers.find((t) => normEmail(t.email) === stored)
        : undefined;
      const teacherId = teacherRow?.id;

      if (typeof teacherId !== "number") {
        setRows([]);
        return;
      }

      const merged = mergeTas(rawTas, teacherRow ?? undefined);
      const allowedGroups = new Set<number>();
      for (const ta of merged) {
        if (ta.teacher === teacherId && typeof ta.group === "number") {
          allowedGroups.add(ta.group);
        }
      }

      const mapped: DisplayRow[] = [];
      if (allowedGroups.size === 0) {
        setRows([]);
        return;
      }

      for (const s of rawStudents) {
        const gid = typeof s.group === "number" ? s.group : null;
        if (gid == null || !allowedGroups.has(gid)) continue;
        const uid =
          s.user_id != null ? String(s.user_id) : s.id != null ? String(s.id) : "";
        if (!uid) continue;
        mapped.push({
          id: uid,
          name: typeof s.full_name === "string" ? s.full_name : "—",
          email: typeof s.email === "string" ? s.email : "",
          year:
            typeof s.year === "number" ? yMap.get(s.year) ?? "—" : "—",
          section:
            typeof s.section === "number"
              ? secMap.get(s.section) ?? "—"
              : "—",
          group:
            typeof s.group === "number" ? gMap.get(s.group) ?? "—" : "—",
        });
      }

      mapped.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      setRows(mapped);
    } catch {
      toast.error(
        isAr ? "تعذر تحميل قائمة الطلاب." : "Could not load your student roster."
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    void load();
  }, [load]);

  const groupOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.group).filter((g) => g && g !== "—"));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const yearOpts = useMemo(() => collectYears(rows), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const okSearch =
        q.length === 0 ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q);
      if (!okSearch) return false;
      if (yearFilter !== "all" && r.year !== yearFilter) return false;
      if (groupFilter !== "all" && r.group !== groupFilter) return false;
      return true;
    });
  }, [rows, search, yearFilter, groupFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const sliceStart = (pageSafe - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(sliceStart, sliceStart + PAGE_SIZE);

  const filterSummary =
    yearFilter === "all" && groupFilter === "all"
      ? isAr
        ? "الكل"
        : "All"
      : [yearFilter !== "all" ? yearFilter : null, groupFilter !== "all" ? groupFilter : null]
          .filter(Boolean)
          .join(" · ");

  const paginationItems = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items: number[] = [1];
    if (pageSafe > 3) items.push(-1);
    const start = Math.max(2, pageSafe - 1);
    const end = Math.min(totalPages - 1, pageSafe + 1);
    for (let p = start; p <= end; p++) items.push(p);
    if (pageSafe < totalPages - 2) items.push(-2);
    items.push(totalPages);
    return items;
  }, [pageSafe, totalPages]);

  return (
    <section className="space-y-4 rounded-xl border border-[#51689A]/25 bg-[#F6F7FE]/50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#1B2065F2]">
          <Users className="size-5 shrink-0" strokeWidth={1.75} />
          <h2 className="text-base font-semibold sm:text-lg">
            {isAr ? "قائمة الطلاب" : "Student roster"}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {isAr
            ? "طلاب الشعب المرتبطة بتعييناتك التدريسية فقط."
            : "Students in groups linked to your teaching assignments only."}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={isAr ? "بحث بالاسم أو البريد…" : "Search name or email…"}
            className="h-10 pe-9"
            disabled={loading}
          />
          <Search className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <DropdownMenu open={openFilter} onOpenChange={setOpenFilter}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={`${controlBtnClass} inline-flex items-center gap-1.5`}
            >
              <Funnel className="size-4 shrink-0" />
              <span>{isAr ? "تصفية" : "Filter"}</span>
              <span className="text-xs text-muted-foreground">({filterSummary})</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">
              {isAr ? "السنة" : "Year"}
            </p>
            <DropdownMenuItem
              onClick={() => {
                setYearFilter("all");
                setPage(1);
                setOpenFilter(false);
              }}
            >
              {isAr ? "كل السنوات" : "All years"}
            </DropdownMenuItem>
            {yearOpts.map((y) => (
              <DropdownMenuItem
                key={y}
                onClick={() => {
                  setYearFilter(y);
                  setPage(1);
                  setOpenFilter(false);
                }}
              >
                {y}
              </DropdownMenuItem>
            ))}
            <p className="mt-2 px-2 py-1 text-xs font-semibold text-muted-foreground">
              {isAr ? "الشعبة" : "Group"}
            </p>
            <DropdownMenuItem
              onClick={() => {
                setGroupFilter("all");
                setPage(1);
                setOpenFilter(false);
              }}
            >
              {isAr ? "كل الشعب" : "All groups"}
            </DropdownMenuItem>
            {groupOptions.map((g) => (
              <DropdownMenuItem
                key={g}
                onClick={() => {
                  setGroupFilter(g);
                  setPage(1);
                  setOpenFilter(false);
                }}
              >
                {g}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{isAr ? "جاري التحميل…" : "Loading…"}</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          {rows.length === 0
            ? isAr
              ? "لا يوجد طلاب في شعبك بعد، أو لم تُربَط حساباتك بتعيينات تدريسية."
              : "No students in your assigned groups yet—or your account has no teaching assignments."
            : isAr
              ? "لا توجد نتائج لهذا البحث أو التصفية."
              : "No students match this search or filter."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[#51689A]/20 bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b bg-[#F6F7FE] text-left text-[#51689A]">
                <tr>
                  <th className="px-3 py-2 font-semibold">{isAr ? "الاسم" : "Name"}</th>
                  <th className="px-3 py-2 font-semibold">{isAr ? "البريد" : "Email"}</th>
                  <th className="px-3 py-2 font-semibold">{isAr ? "السنة" : "Year"}</th>
                  <th className="px-3 py-2 font-semibold">{isAr ? "القسم" : "Section"}</th>
                  <th className="px-3 py-2 font-semibold">{isAr ? "الشعبة" : "Group"}</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 font-medium text-[#1B2065]">{r.name}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-[#51689A]">
                      {r.email || "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-[#51689A]">{r.year}</td>
                    <td className="px-3 py-2 text-[#51689A]">{r.section}</td>
                    <td className="px-3 py-2 text-[#51689A]">{r.group}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <Pagination className="justify-center">
              <PaginationContent className="flex-wrap gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={pageSafe <= 1 ? "pointer-events-none opacity-40" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                  />
                </PaginationItem>
                {paginationItems.map((p, idx) =>
                  p === -1 || p === -2 ? (
                    <PaginationItem key={`g-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === pageSafe}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(p);
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={
                      pageSafe >= totalPages ? "pointer-events-none opacity-40" : ""
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </>
      )}
    </section>
  );
}
