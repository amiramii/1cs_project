"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ListChecks, Search } from "lucide-react";

import { useLanguage } from "@/app/_components/language-provider";
import { Input } from "@/components/ui/input";
import {
  loadProfessorSessionData,
  type AssignmentApi,
  type AttendanceRow,
  type SessionApi,
} from "@/lib/professorSessionData";
import { currentAcademicStartYear } from "@/lib/semesterAcademic";

type AttendanceCard = {
  assignment: AssignmentApi;
  presentPct: number;
  participationPct: number;
};

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function assignmentSubtitle(a: AssignmentApi): string {
  return [
    a.year_name?.trim() || "—",
    a.group_name?.trim() || "—",
    a.semester?.trim() || "—",
  ].join(" - ");
}

function assignmentMatches(a: AssignmentApi, q: string): boolean {
  if (!q) return true;
  const haystack = [
    a.module_name,
    a.group_name,
    a.year_name,
    a.semester,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function buildCards(
  assignments: AssignmentApi[],
  sessions: SessionApi[],
  attendanceRows: AttendanceRow[]
): AttendanceCard[] {
  const rowsBySession = new Map<number, AttendanceRow[]>();
  for (const row of attendanceRows) {
    if (typeof row.session !== "number") continue;
    const list = rowsBySession.get(row.session) ?? [];
    list.push(row);
    rowsBySession.set(row.session, list);
  }

  return assignments.map((assignment) => {
    const sessionIds = new Set(
      sessions
        .filter((session) => session.assignment === assignment.id)
        .map((session) => session.id)
    );
    const rows = [...sessionIds].flatMap((id) => rowsBySession.get(id) ?? []);
    const total = rows.length;
    const present = rows.filter((row) => row.status === "present").length;
    const participated = rows.filter((row) => {
      const points = Number(row.extra_values?.participation_points ?? 0);
      return Number.isFinite(points) && points > 0;
    }).length;

    return {
      assignment,
      presentPct: pct(present, total),
      participationPct: pct(participated, total),
    };
  });
}

export default function ProfStudentsRoster() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<AttendanceCard[]>([]);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await loadProfessorSessionData(isAr);
      setCards(
        buildCards(
          bundle.assignments,
          bundle.sessions,
          bundle.teacherAttendanceRows
        )
      );
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((card) => assignmentMatches(card.assignment, q));
  }, [cards, search]);

  const academicYear = currentAcademicStartYear();

  return (
    <section className="w-full min-w-0 space-y-5 font-montserrat text-[#1B2065] dark:text-[#EEF4F7]">
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {isAr ? "حضور مجموعاتك" : "Your Groups Attendance"}
        </h1>
        <p className="text-[15px] text-[#51689A] dark:text-[#9BA8C4]">
          {isAr
            ? "تحقق من حضور مجموعاتك خلال الفصل"
            : "Check your groups semestrial attendance"}
        </p>
      </header>

      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-md border border-[#51689A]/35 bg-[#FEF9F9] shadow-sm dark:border-[#383F58] dark:bg-[#1A2036]">
        <div className="flex flex-col gap-3 bg-[#51689A] px-3 py-2 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-bold">
            <ListChecks className="size-4 rounded border border-white/50 p-0.5" />
            {isAr ? "قائمة الحصص" : "Schedule list"}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "بحث..." : "Search..."}
              className="h-8 rounded border border-[#51689A]/25 bg-[#FEF9F9] pe-9 ps-3 text-sm text-[#1B2065] placeholder:text-[#51689A] focus-visible:ring-[#1B2065]/30 dark:border-[#383F58] dark:bg-[#1A2036] dark:text-[#EEF4F7] dark:placeholder:text-[#9BA8C4] dark:focus-visible:ring-[#74A7BD]/30"
              disabled={loading}
            />
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[#1B2065] dark:text-[#9BA8C4]" />
          </div>
        </div>

        <div className="space-y-5 px-3 py-5 sm:px-6">
          {loading ? (
            <p className="py-6 text-center text-sm text-[#51689A] dark:text-[#9BA8C4]">
              {isAr ? "جاري التحميل..." : "Loading..."}
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#51689A] dark:text-[#9BA8C4]">
              {cards.length === 0
                ? isAr
                  ? "لا توجد مجموعات لعرضها بعد."
                  : "No groups to show yet."
                : isAr
                  ? "لا توجد نتائج لهذا البحث."
                  : "No schedule matches this search."}
            </p>
          ) : (
            filtered.map(({ assignment, presentPct, participationPct }) => (
              <Link
                key={assignment.id}
                href={`/Students/semestrial?a=${assignment.id}&ay=${academicYear}&sem=${
                  assignment.semester === "S2" ? "S2" : "S1"
                }`}
                className="grid min-h-[72px] grid-cols-1 items-center gap-4 rounded border border-[#51689A]/45 bg-[#F6F7FE] px-4 py-3 shadow-sm transition hover:border-[#51689A] hover:bg-[#F8FAFF] dark:border-[#383F58] dark:bg-[#242A40] dark:hover:bg-[#2A314A] sm:grid-cols-[1fr_auto_auto]"
              >
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-[#1B2065] dark:text-[#EEF4F7]">
                    {assignment.module_name?.trim() || "—"}
                  </h2>
                  <p className="mt-1 text-xs font-medium text-[#51689A] dark:text-[#9BA8C4]">
                    {assignmentSubtitle(assignment)}
                  </p>
                </div>
                <div className="flex items-baseline gap-4 sm:min-w-[118px] sm:justify-end">
                  <span className="text-xl font-bold tabular-nums text-[#74A7BD]">
                    {presentPct}%
                  </span>
                  <span className="text-[10px] font-medium text-[#51689A] dark:text-[#9BA8C4]">
                    {isAr ? "حاضر" : "Present"}
                  </span>
                </div>
                <div className="flex items-baseline gap-4 sm:min-w-[160px] sm:justify-end">
                  <span className="text-xl font-bold tabular-nums text-[#51689A]">
                    {participationPct}%
                  </span>
                  <span className="text-[10px] font-medium text-[#51689A] dark:text-[#9BA8C4]">
                    {isAr ? "نسبة المشاركة" : "Participation rate"}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
