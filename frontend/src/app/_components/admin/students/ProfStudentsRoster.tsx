"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ListChecks, Search } from "lucide-react";

import { useLanguage } from "@/app/_components/language-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SessionTypeBadge } from "@/lib/SessionTypeBadge";
import {
  loadWeeklyTimetableSlots,
  type TimetableSlotRow,
} from "@/lib/excelTimetableClient";
import {
  loadProfessorSessionData,
  type AssignmentApi,
  type AttendanceRow,
  type SessionApi,
} from "@/lib/professorSessionData";
import { currentAcademicStartYear } from "@/lib/semesterAcademic";
import { PROF_SESSION_SAVED_EVENT } from "@/lib/professorSessionEvents";
import {
  sessionMatchesAssignmentSlotType,
  sessionTypesForAssignment,
  sortSessionTypes,
} from "@/lib/sessionTypeTimetable";

type AttendanceCard = {
  assignment: AssignmentApi;
  sessionType: string;
  presentPct: number;
  participationPct: number;
};

type ScheduleSemester = "S1" | "S2";

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function assignmentLine(a: AssignmentApi): string {
  const module = a.module_name?.trim() || "—";
  const group = a.group_name?.trim() || "—";
  const sem = a.semester?.trim() || "—";
  return `${module} - ${group} - ${sem}`;
}

function cardMatchesSearch(
  card: AttendanceCard,
  q: string
): boolean {
  if (!q) return true;
  const haystack = [
    card.assignment.module_name,
    card.assignment.group_name,
    card.assignment.year_name,
    card.assignment.semester,
    card.sessionType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function assignmentSemester(a: AssignmentApi): ScheduleSemester {
  return a.semester === "S2" ? "S2" : "S1";
}

function buildCards(
  assignments: AssignmentApi[],
  sessions: SessionApi[],
  attendanceRows: AttendanceRow[],
  slots: TimetableSlotRow[]
): AttendanceCard[] {
  const rowsBySession = new Map<number, AttendanceRow[]>();
  for (const row of attendanceRows) {
    if (typeof row.session !== "number") continue;
    const list = rowsBySession.get(row.session) ?? [];
    list.push(row);
    rowsBySession.set(row.session, list);
  }

  const cards: AttendanceCard[] = [];

  for (const assignment of assignments) {
    const types = sessionTypesForAssignment(assignment, slots);
    const typeRows =
      types.length > 0 ? types : [""];

    for (const sessionType of typeRows) {
      const sessionIds = new Set(
        sessions
          .filter((session) =>
            sessionType
              ? sessionMatchesAssignmentSlotType(
                  session,
                  assignment,
                  sessionType,
                  slots
                )
              : session.assignment === assignment.id
          )
          .map((session) => session.id)
      );
      const rows = [...sessionIds].flatMap(
        (id) => rowsBySession.get(id) ?? []
      );
      const total = rows.length;
      const present = rows.filter((row) => row.status === "present").length;
      const participated = rows.filter((row) => {
        const points = Number(row.extra_values?.participation_points ?? 0);
        return Number.isFinite(points) && points > 0;
      }).length;

      cards.push({
        assignment,
        sessionType,
        presentPct: pct(present, total),
        participationPct: pct(participated, total),
      });
    }
  }

  return cards.sort((a, b) => {
    const modA = a.assignment.module_name ?? "";
    const modB = b.assignment.module_name ?? "";
    const modCmp = modA.localeCompare(modB, undefined, { sensitivity: "base" });
    if (modCmp !== 0) return modCmp;
    const typesA = sortSessionTypes(
      a.sessionType ? [a.sessionType] : []
    );
    const typesB = sortSessionTypes(
      b.sessionType ? [b.sessionType] : []
    );
    const typeA = typesA[0] ?? "";
    const typeB = typesB[0] ?? "";
    return typeA.localeCompare(typeB, undefined, { sensitivity: "base" });
  });
}

function semestrialHref(
  assignmentId: number,
  academicYear: number,
  scheduleSem: ScheduleSemester,
  sessionType: string
): string {
  const params = new URLSearchParams({
    a: String(assignmentId),
    ay: String(academicYear),
    sem: scheduleSem,
  });
  if (sessionType.trim()) {
    params.set("stype", sessionType.trim());
  }
  return `/Students/semestrial?${params.toString()}`;
}

export default function ProfStudentsRoster() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<AttendanceCard[]>([]);
  const [search, setSearch] = useState("");
  const [scheduleSem, setScheduleSem] = useState<ScheduleSemester>("S1");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bundle, timetable] = await Promise.all([
        loadProfessorSessionData(isAr, { cacheBust: true }),
        loadWeeklyTimetableSlots({
          gradeFilter: "all",
          semester: scheduleSem,
        }).catch(() => ({ slots: [] as TimetableSlotRow[] })),
      ]);
      setCards(
        buildCards(
          bundle.assignments,
          bundle.sessions,
          bundle.teacherAttendanceRows,
          timetable.slots
        )
      );
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [isAr, scheduleSem]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onSaved = () => void load();
    window.addEventListener(PROF_SESSION_SAVED_EVENT, onSaved);
    return () => window.removeEventListener(PROF_SESSION_SAVED_EVENT, onSaved);
  }, [load]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((card) => {
      if (assignmentSemester(card.assignment) !== scheduleSem) return false;
      return cardMatchesSearch(card, q);
    });
  }, [cards, search, scheduleSem]);

  const academicYear = currentAcademicStartYear();

  return (
    <section className="box-border w-full min-w-0 max-w-full space-y-5 font-montserrat text-[#1B2065] dark:text-[#EEF4F7]">
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

      <div className="box-border w-full min-w-0 max-w-full rounded-md border border-[#51689A]/35 bg-[#FEF9F9] shadow-sm dark:border-[#383F58] dark:bg-[#1A2036]">
        <div className="flex flex-col gap-3 bg-[#51689A] px-3 py-2 text-white lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm font-bold">
            <ListChecks className="size-4 rounded border border-white/50 p-0.5" />
            {isAr ? "قائمة الحصص" : "Schedule list"}
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
            <div className="relative w-full sm:max-w-xs lg:min-w-[14rem]">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "بحث..." : "Search..."}
                className="h-8 w-full rounded border border-[#51689A]/25 bg-[#FEF9F9] pe-9 ps-3 text-sm text-[#1B2065] placeholder:text-[#51689A] focus-visible:ring-[#1B2065]/30 dark:border-[#383F58] dark:bg-[#1A2036] dark:text-[#EEF4F7] dark:placeholder:text-[#9BA8C4] dark:focus-visible:ring-[#74A7BD]/30"
                disabled={loading}
              />
              <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[#1B2065] dark:text-[#9BA8C4]" />
            </div>
            <div className="flex shrink-0 gap-0.5 self-end rounded-lg bg-white/15 p-0.5 sm:self-auto">
              {(["S1", "S2"] as const).map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-8 min-w-[2.75rem] rounded-md px-3 text-xs font-semibold",
                    scheduleSem === s
                      ? "bg-white text-[#1B2065] shadow-sm"
                      : "text-white/90 hover:bg-white/20 hover:text-white"
                  )}
                  onClick={() => setScheduleSem(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5 px-3 py-5 sm:px-6">
          {loading ? (
            <p className="py-6 text-center text-sm text-[#51689A] dark:text-[#9BA8C4]">
              {isAr ? "جاري التحميل..." : "Loading..."}
            </p>
          ) : filteredCards.length === 0 ? (
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
            filteredCards.map(
              ({
                assignment,
                sessionType,
                presentPct,
                participationPct,
              }) => (
                <Link
                  key={`${assignment.id}-${sessionType || "all"}`}
                  href={semestrialHref(
                    assignment.id,
                    academicYear,
                    scheduleSem,
                    sessionType
                  )}
                  className="grid min-h-[72px] w-full min-w-0 max-w-full grid-cols-1 items-center gap-3 rounded border border-[#51689A]/45 bg-[#F6F7FE] px-3 py-3 shadow-sm transition hover:border-[#51689A] hover:bg-[#F8FAFF] dark:border-[#383F58] dark:bg-[#242A40] dark:hover:bg-[#2A314A] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-4 sm:px-4"
                >
                  <div className="min-w-0 max-w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-bold text-[#1B2065] dark:text-[#EEF4F7]">
                        {assignmentLine(assignment)}
                      </h2>
                      {sessionType ? (
                        <SessionTypeBadge
                          type={sessionType}
                          isAr={isAr}
                        />
                      ) : null}
                    </div>
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
              )
            )
          )}
        </div>
      </div>
    </section>
  );
}
