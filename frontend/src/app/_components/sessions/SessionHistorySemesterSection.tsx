"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  academicStartYearsFromSessions,
  currentAcademicStartYear,
  inferAcademicStartYearFromDate,
  inferSemesterForDate,
  isIsoDateInRange,
  semesterBounds,
} from "@/lib/semesterAcademic";
import type { AttendanceRow, SessionApi, AssignmentApi } from "@/lib/professorSessionData";

const STATUS_HEX = {
  present: "#74A7BD",
  absent: "#C71122",
  justified: "#E7CE51",
} as const;

type Props = {
  isAr: boolean;
  assignments: AssignmentApi[];
  sessions: SessionApi[];
  teacherAttendanceRows: AttendanceRow[];
};

type Semester = "S1" | "S2";

function SessionHistorySemesterSection({
  isAr,
  assignments,
  sessions,
  teacherAttendanceRows,
}: Props) {
  const [sem, setSem] = useState<Semester>("S1");
  const [academicStartYear, setAcademicStartYear] = useState(() =>
    currentAcademicStartYear()
  );

  const yearOptions = useMemo(
    () => academicStartYearsFromSessions(sessions.map((s) => s.date)),
    [sessions]
  );

  const { from, to } = useMemo(
    () => semesterBounds(sem, academicStartYear),
    [sem, academicStartYear]
  );

  /**
   * If the selected S1/S2 window contains no sessions but we do have sessions in
   * the app (e.g. May dates while S1 Sep–Jan is selected), align filters to the
   * latest session so history percentages update without manual toggling.
   */
  useEffect(() => {
    if (sessions.length === 0) return;

    const anyInView = sessions.some((s) =>
      isIsoDateInRange(s.date, from, to)
    );
    if (anyInView) return;

    const latest = [...sessions].sort((a, b) =>
      b.date.localeCompare(a.date)
    )[0];
    if (!latest?.date) return;

    const ay = inferAcademicStartYearFromDate(latest.date);
    const nextSem = inferSemesterForDate(latest.date, ay);
    setAcademicStartYear(ay);
    setSem(nextSem);
  }, [sessions, from, to]);
  const yearLabel = (y: number) => `${y}–${(y + 1).toString().slice(-2)}`;

  const nudgeYear = (delta: -1 | 1) => {
    setAcademicStartYear((y) => y + delta);
  };

  const courseSummaries = useMemo(() => {
    /** Same scale as the attendance sheet (typical max points per mark). */
    const PARTICIPATION_CAP_PER_MARK = 10;
    return assignments.map((a) => {
      const list = sessions.filter(
        (s) => s.assignment === a.id && isIsoDateInRange(s.date, from, to)
      );
      const sessionIds = new Set(list.map((s) => s.id));
      const rel = teacherAttendanceRows.filter(
        (r) => r.session != null && sessionIds.has(r.session)
      );
      let p = 0;
      let totalPts = 0;
      for (const r of rel) {
        if (r.status === "present") p++;
        const raw = Number(r.extra_values?.participation_points);
        if (Number.isFinite(raw)) totalPts += Math.trunc(raw);
      }
      const markable = rel.length;
      const presentPct = markable ? Math.round((100 * p) / markable) : 0;
      const participationPct = markable
        ? Math.min(
            100,
            Math.max(
              0,
              Math.round(
                (100 * totalPts) / (markable * PARTICIPATION_CAP_PER_MARK)
              )
            )
          )
        : 0;
      return {
        assignment: a,
        sessionCount: list.length,
        presentPct,
        participationPct,
        markable,
      };
    });
  }, [assignments, sessions, from, to, teacherAttendanceRows]);

  const hrefFor = (assignmentId: number) => {
    const p = new URLSearchParams();
    p.set("a", String(assignmentId));
    p.set("ay", String(academicStartYear));
    p.set("sem", sem);
    return `/Sessions/semestrial?${p.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {isAr ? "سجل الحصص" : "Session history"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "حسب المادة/الشعبة والفصل. افتح لعرض جدول التحصي النصفي كاملاً."
              : "By module, group, and semester. Open to see the full semestrial sheet."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-xs font-medium text-[#51689A]">
            {isAr ? "السنة الدراسية" : "Academic year"}
          </p>
          <div className="flex items-center gap-1 rounded-full border border-[#51689A]/30 bg-white px-1 py-0.5 shadow-sm">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-[#1B2065]"
              onClick={() => nudgeYear(-1)}
              aria-label="Previous year"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span
              className="min-w-[4.5rem] text-center text-sm font-semibold text-[#1B2065] tabular-nums"
              dir="ltr"
            >
              {yearLabel(academicStartYear)}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-[#1B2065]"
              onClick={() => nudgeYear(1)}
              aria-label="Next year"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex gap-1 rounded-lg bg-[#EEF0FB] p-0.5">
            {(["S1", "S2"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSem(s)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                  sem === s
                    ? "bg-[#1B2065] text-white shadow"
                    : "text-[#51689A] hover:bg-white/60"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {yearOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {yearOptions.map((y) => (
                <Button
                  key={y}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAcademicStartYear(y)}
                >
                  {yearLabel(y)}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="relative rounded-2xl border border-border bg-[#F6F7FE] p-10 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white shadow-inner">
            <CalendarRange
              className="size-8 text-blue-primary/70"
              strokeWidth={1.25}
            />
          </div>
          <h3 className="text-lg font-semibold text-blue-primary/80">
            {isAr ? "لا يوجد تعيينات" : "No teaching assignments"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {isAr
              ? "تظهر هنا مادة/شعبة لكل تعيين تدريس. عندما تُتاح على الخادم تظهر تلقائياً."
              : "A row appears for each module–group you teach. Add assignments on the server to see them here."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {courseSummaries.map(
            ({ assignment, sessionCount, presentPct, participationPct }) => (
            <li key={assignment.id}>
              <Link
                href={hrefFor(assignment.id)}
                title={
                  isAr
                    ? `${sessionCount} حصة في هذه الفترة`
                    : `${sessionCount} session(s) in this period`
                }
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#C5D4E0] bg-[#FAFBFF] p-4 text-start shadow-sm transition-all hover:border-[#74A7BD]/50 hover:shadow-md sm:gap-6 sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-[#1B2065] sm:text-lg">
                    {assignment.module_name ?? "—"}
                  </p>
                  <p className="mt-0.5 text-sm text-[#51689A]">
                    {assignment.group_name ?? "—"}{" "}
                    <span className="text-[#1B2065]/40">·</span>{" "}
                    {sem} {yearLabel(academicStartYear)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-4 sm:gap-6">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className="text-xl font-bold tabular-nums sm:text-2xl"
                      style={{ color: STATUS_HEX.present }}
                    >
                      {presentPct}%
                    </span>
                    <span className="text-xs font-medium text-[#51689A] sm:text-sm">
                      {isAr ? "حاضر" : "Present"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xl font-bold tabular-nums text-[#51689A] sm:text-2xl">
                      {participationPct}%
                    </span>
                    <span className="max-w-[5.5rem] text-xs font-medium leading-snug text-[#51689A] sm:max-w-none sm:text-sm">
                      {isAr ? "معدل المشاركة" : "Participation rate"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SessionHistorySemesterSection;
