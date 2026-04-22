import dayjs from "dayjs";

/**
 * Academic year = Sep → following Aug. `academicStartYear` is the calendar year
 * when the year begins in September (e.g. 2024 for 2024–25).
 * - S1: Sep → Jan (inclusive) across two calendar years
 * - S2: Feb → Aug (inclusive)
 */
export function inferAcademicStartYearFromDate(iso: string): number {
  const t = dayjs(iso);
  const m = t.month() + 1;
  if (m >= 9) return t.year();
  if (m === 1) return t.year() - 1;
  return t.year() - 1;
}

export function currentAcademicStartYear(): number {
  return inferAcademicStartYearFromDate(dayjs().format("YYYY-MM-DD"));
}

export function semesterBounds(
  sem: "S1" | "S2",
  academicStartYear: number
): { from: string; to: string } {
  if (sem === "S1") {
    return {
      from: `${academicStartYear}-09-01`,
      to: `${academicStartYear + 1}-01-31`,
    };
  }
  return {
    from: `${academicStartYear + 1}-02-01`,
    to: `${academicStartYear + 1}-08-31`,
  };
}

export function isIsoDateInRange(
  iso: string,
  from: string,
  to: string
): boolean {
  if (!iso) return false;
  return iso >= from && iso <= to;
}

export function academicStartYearsFromSessions(
  sessionDates: string[]
): number[] {
  const s = new Set<number>();
  for (const d of sessionDates) {
    if (d) s.add(inferAcademicStartYearFromDate(d));
  }
  s.add(currentAcademicStartYear());
  return [...s].sort((a, b) => b - a);
}
