import { getApiBaseUrl } from "@/lib/apiBase";
import { checkinPath } from "@/lib/checkinApi";
import { getStudentById } from "@/lib/checkinClient";
import { formatDashboardCount } from "@/lib/dashboardMetrics";
import { loadDrfListAll } from "@/lib/drfPaginatedList";
import { getAccessToken } from "@/lib/tokenStorage";

export type SchoolingTotalsStats = {
  staff: { total: number };
  justifications: { pending: number; accepted: number; refused: number };
  teacher_absence_requests: { pending: number; accepted: number; refused: number };
};

export type AdminTotalsStats = {
  students: { total: number };
  teachers: { total: number };
  modules_covered: number;
  unjustified_absences: number;
  unjustified_rate_by_year: number;
  justified_absence_rate: number;
  average_absence_rate: number;
  schooling: SchoolingTotalsStats;
};

function listHeaders(): HeadersInit {
  const t = getAccessToken();
  return t?.trim() ? { Authorization: `Bearer ${t.trim()}` } : {};
}

function roundPercent(n: number): number {
  return Math.round(n * 10) / 10;
}

function countByStatus(
  rows: { status?: string }[],
  keys: readonly string[]
): Record<string, number> {
  const counts = Object.fromEntries(keys.map((k) => [k, 0])) as Record<
    string,
    number
  >;
  for (const row of rows) {
    const s = String(row.status ?? "").toLowerCase();
    if (s in counts) counts[s] += 1;
  }
  return counts;
}

function countDistinctModules(
  assignments: { module?: number | string }[]
): number {
  const ids = new Set<number | string>();
  for (const a of assignments) {
    if (a.module != null) ids.add(a.module);
  }
  return ids.size;
}

async function buildStudentPkToYear(
  attendance: { student?: number | string }[]
): Promise<Map<number, number | string>> {
  const pks = [
    ...new Set(
      attendance
        .map((r) => r.student)
        .filter((id): id is number => typeof id === "number" && id > 0)
    ),
  ];
  const map = new Map<number, number | string>();
  const BATCH = 12;
  for (let i = 0; i < pks.length; i += BATCH) {
    const slice = pks.slice(i, i + BATCH);
    await Promise.all(
      slice.map(async (pk) => {
        try {
          const res = await getStudentById(pk);
          if (!res.ok) return;
          const raw = (await res.json()) as { year?: number | string };
          if (raw.year != null) map.set(pk, raw.year);
        } catch {
          /* skip */
        }
      })
    );
  }
  return map;
}

function computeAttendanceRates(
  attendance: { student?: number | string; status?: string }[],
  studentPkToYear: Map<number, number | string>,
  years: { id?: number | string }[]
): {
  unjustified_absences: number;
  unjustified_rate_by_year: number;
  justified_absence_rate: number;
  average_absence_rate: number;
} {
  let unjustified = 0;
  let justified = 0;
  let total = 0;

  for (const row of attendance) {
    const s = String(row.status ?? "").toLowerCase();
    total += 1;
    if (s === "absent") unjustified += 1;
    else if (s === "justified") justified += 1;
  }

  const absenceTotal = unjustified + justified;
  const justified_absence_rate = roundPercent(
    absenceTotal ? (justified / absenceTotal) * 100 : 0
  );
  const average_absence_rate = roundPercent(
    total ? (absenceTotal / total) * 100 : 0
  );

  const yearRates: number[] = [];
  for (const year of years) {
    const yearId = year.id;
    if (yearId == null) continue;
    let yearTotal = 0;
    let yearUnjust = 0;
    for (const row of attendance) {
      const sid = row.student;
      if (typeof sid !== "number" || studentPkToYear.get(sid) !== yearId) continue;
      yearTotal += 1;
      if (String(row.status ?? "").toLowerCase() === "absent") yearUnjust += 1;
    }
    if (yearTotal > 0) yearRates.push((yearUnjust / yearTotal) * 100);
  }

  const unjustified_rate_by_year = roundPercent(
    yearRates.length
      ? yearRates.reduce((a, b) => a + b, 0) / yearRates.length
      : 0
  );

  return {
    unjustified_absences: unjustified,
    unjustified_rate_by_year,
    justified_absence_rate,
    average_absence_rate,
  };
}

async function loadList<T>(
  path: string
): Promise<T[]> {
  try {
    return await loadDrfListAll<T>(
      getApiBaseUrl(),
      path,
      listHeaders(),
      {}
    );
  } catch {
    return [];
  }
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

/** Aggregates admin/schooling KPIs from existing list APIs (no dedicated stats endpoint). */
export async function fetchAdminTotalsStats(): Promise<AdminTotalsStats | null> {
  const headers = listHeaders();
  if (!getAccessToken()?.trim()) return null;

  try {
    const [
      students,
      teachers,
      schoolingStaff,
      assignments,
      attendance,
      years,
      justifications,
      teacherAbsences,
    ] = await Promise.all([
      loadList<Record<string, never>>(`${checkinPath.students}/`),
      loadList<{ id?: number }>(`${checkinPath.teachers}/`),
      loadList<{ id?: number }>(`${checkinPath.schooling}/`),
      loadList<{ module?: number | string }>(
        `${checkinPath.academic.teachingAssignments}/`
      ),
      loadList<{ student?: number | string; status?: string }>(
        `${checkinPath.attendance.attendance}/`
      ),
      loadList<{ id?: number | string }>(
        `${checkinPath.academic.years}/`
      ),
      loadList<{ status?: string }>(
        `${checkinPath.justifications.collection}/`
      ),
      loadList<{ status?: string }>(
        `${checkinPath.teacherAbsence.collection}/`
      ),
    ]);

    const studentPkToYear = await buildStudentPkToYear(attendance);
    const attRates = computeAttendanceRates(
      attendance,
      studentPkToYear,
      years
    );
    const justCounts = countByStatus(justifications, [
      "pending",
      "accepted",
      "refused",
    ] as const);
    const profCounts = countByStatus(teacherAbsences, [
      "pending",
      "accepted",
      "refused",
    ] as const);

    return {
      students: { total: students.length },
      teachers: { total: teachers.length },
      modules_covered: countDistinctModules(assignments),
      ...attRates,
      schooling: {
        staff: { total: schoolingStaff.length },
        justifications: {
          pending: justCounts.pending ?? 0,
          accepted: justCounts.accepted ?? 0,
          refused: justCounts.refused ?? 0,
        },
        teacher_absence_requests: {
          pending: profCounts.pending ?? 0,
          accepted: profCounts.accepted ?? 0,
          refused: profCounts.refused ?? 0,
        },
      },
    };
  } catch {
    return null;
  }
}

export { formatDashboardCount };
