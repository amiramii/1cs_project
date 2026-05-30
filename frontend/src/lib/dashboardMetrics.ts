import {
  fetchStudentAbsencesByDate,
  fetchStudentAbsencesByModule,
  loadStudentExclusions,
  loadStudentJustificationsList,
} from "@/lib/checkinClient";
import { fetchAdminTotalsStats } from "@/lib/adminTotalsMetrics";
import { getApiBaseUrl } from "@/lib/apiBase";
import { checkinPath } from "@/lib/checkinApi";
import { loadDrfListAll, unwrapList } from "@/lib/drfPaginatedList";
import {
  loadProfessorSessionData,
} from "@/lib/professorSessionData";
import { getAbsenceSeverity, type AbsenceSeverity } from "@/lib/moduleExclusionPolicy";
import { getAccessToken } from "@/lib/tokenStorage";

export type DashboardChartPoint = {
  key: string;
  label: string;
  value: number;
  severity?: AbsenceSeverity;
};

export type DashboardTrendPoint = {
  day: string;
  date: string;
  value: number;
};

export type AdminLikeDashboardCharts = {
  overview: DashboardChartPoint[];
  sessionsTrend: DashboardTrendPoint[];
  attendanceByStatus: DashboardChartPoint[];
};

export type SchoolingDashboardCharts = {
  reviewWorkload: DashboardChartPoint[];
  justificationsByStatus: DashboardChartPoint[];
  teacherAbsenceByStatus: DashboardChartPoint[];
};

export type ProfessorDashboardCharts = {
  overview: DashboardChartPoint[];
  sessionsTrend: DashboardTrendPoint[];
  exclusionStatus: DashboardChartPoint[];
};

export type StudentDashboardCharts = {
  justificationsByStatus: DashboardChartPoint[];
  absencesTrend: DashboardTrendPoint[];
  absencesByModule: DashboardChartPoint[];
};

function listHeaders(): HeadersInit {
  const t = getAccessToken();
  return t?.trim() ? { Authorization: `Bearer ${t.trim()}` } : {};
}

export function todayLocalIso(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDashboardCount(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString() : "0";
}

type DocRow = { audience?: string };

/** Admin + schooling control-center tiles (best-effort; roles without list access get zeros). */
export async function fetchAdminLikeDashboardMetrics(): Promise<{
  teachers: number;
  students: number;
  schedules: number;
  sessionsToday: number;
}> {
  const apiBase = getApiBaseUrl();
  const headers = listHeaders();
  const today = todayLocalIso();
  try {
    const [teachers, students, sessions, documents] = await Promise.all([
      loadDrfListAll<{ id?: number }>(
        apiBase,
        `${checkinPath.teachers}/`,
        headers,
        {}
      ),
      loadDrfListAll<{ id?: number }>(
        apiBase,
        `${checkinPath.students}/`,
        headers,
        {}
      ),
      loadDrfListAll<{ date?: string }>(
        apiBase,
        `${checkinPath.attendance.sessions}/`,
        headers,
        {}
      ),
      loadDrfListAll<DocRow>(
        apiBase,
        `${checkinPath.documents.collection}/`,
        headers,
        {}
      ),
    ]);
    return {
      teachers: teachers.length,
      students: students.length,
      schedules: documents.length,
      sessionsToday: sessions.filter((s) => s.date === today).length,
    };
  } catch {
    return { teachers: 0, students: 0, schedules: 0, sessionsToday: 0 };
  }
}

type StudentListRow = {
  group?: number;
  email?: string;
  user_id?: string | number;
};

export async function fetchProfessorDashboardMetrics(isAr: boolean): Promise<{
  sessionsToday: number;
  yourStudents: number;
  activeSchedules: number;
  roomsInUse: number;
}> {
  const apiBase = getApiBaseUrl();
  const headers = listHeaders();
  const today = todayLocalIso();
  try {
    const [bundle, docs, students] = await Promise.all([
      loadProfessorSessionData(isAr),
      loadDrfListAll<DocRow>(
        apiBase,
        `${checkinPath.documents.collection}/?audience=teacher`,
        headers,
        {}
      ),
      loadDrfListAll<StudentListRow>(
        apiBase,
        `${checkinPath.students}/`,
        headers,
        {}
      ),
    ]);
    const groupIds = new Set(
      bundle.assignments
        .map((a) => a.group)
        .filter((g): g is number => typeof g === "number")
    );
    const rosterKeys = new Set<string>();
    for (const row of students) {
      if (typeof row.group !== "number" || !groupIds.has(row.group)) continue;
      const mail =
        typeof row.email === "string" ? row.email.trim().toLowerCase() : "";
      if (mail) rosterKeys.add(mail);
      else if (row.user_id != null) rosterKeys.add(`uid:${row.user_id}`);
    }

    const todaySessions = bundle.sessions.filter((s) => s.date === today);
    const rooms = new Set<string>();
    for (const s of todaySessions) {
      const r = s.room?.trim();
      if (r) rooms.add(r);
    }

    return {
      sessionsToday: todaySessions.length,
      yourStudents: rosterKeys.size,
      activeSchedules: docs.length,
      roomsInUse: rooms.size,
    };
  } catch {
    return {
      sessionsToday: 0,
      yourStudents: 0,
      activeSchedules: 0,
      roomsInUse: 0,
    };
  }
}

/** Calendar week Sun→Sat in local time, inclusive ISO date bounds. */
function sundayStartWeekIsoBounds(): { start: string; end: string } {
  const now = new Date();
  const dow = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dow);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const iso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  return { start: iso(start), end: iso(end) };
}

type StudentSessionSlotRow = {
  date?: string;
  module?: string;
  start_time?: string;
};

function studentSessionSlotKey(row: StudentSessionSlotRow): string {
  return `${row.date ?? ""}|${row.module ?? ""}|${row.start_time ?? ""}`;
}

/**
 * Best-effort count of today's class slots for the signed-in student (frontend only).
 * Derives from attendance sessions, then falls back to absence + justification-linked slots.
 */
async function countStudentSessionsToday(): Promise<number> {
  const today = todayLocalIso();
  const apiBase = getApiBaseUrl();
  const headers = listHeaders();

  try {
    const sessions = await loadDrfListAll<{ date?: string }>(
      apiBase,
      `${checkinPath.attendance.sessions}/`,
      headers,
      {}
    );
    if (sessions.length > 0) {
      return sessions.filter((s) => s.date === today).length;
    }
  } catch {
    /* ignore */
  }

  const slotKeys = new Set<string>();

  try {
    const dateRes = await fetchStudentAbsencesByDate();
    if (dateRes.ok) {
      const raw: unknown = await dateRes.json();
      const arr = unwrapList<StudentSessionSlotRow>(raw);
      for (const row of arr) {
        if (row.date === today) slotKeys.add(studentSessionSlotKey(row));
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const justRows = await loadStudentJustificationsList();
    for (const row of justRows) {
      const atts = row.attendances;
      if (!Array.isArray(atts)) continue;
      for (const att of atts) {
        const slot = att as StudentSessionSlotRow;
        if (slot.date === today) slotKeys.add(studentSessionSlotKey(slot));
      }
    }
  } catch {
    /* ignore */
  }

  return slotKeys.size;
}

export async function fetchStudentDashboardMetrics(): Promise<{
  pendingJustifications: number;
  sessionsToday: number;
}> {
  try {
    const [justRows, sessionsToday] = await Promise.all([
      loadStudentJustificationsList().catch(() => [] as Record<string, unknown>[]),
      countStudentSessionsToday(),
    ]);

    const pendingJustifications = justRows.filter(
      (j) => String(j.status ?? "").toLowerCase() === "pending"
    ).length;

    return { pendingJustifications, sessionsToday };
  } catch {
    return { pendingJustifications: 0, sessionsToday: 0 };
  }
}

const WEEKDAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const WEEKDAY_AR = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

function last7DayIsoDates(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

function weekdayLabel(dateIso: string, isAr: boolean): string {
  const d = new Date(`${dateIso}T12:00:00`);
  const idx = d.getDay();
  return isAr ? WEEKDAY_AR[idx] : WEEKDAY_EN[idx];
}

export function buildLast7DayTrend(
  dateCounts: Map<string, number>,
  isAr: boolean
): DashboardTrendPoint[] {
  return last7DayIsoDates().map((date) => ({
    date,
    day: weekdayLabel(date, isAr),
    value: dateCounts.get(date) ?? 0,
  }));
}

function statusToChartPoints(
  counts: Record<string, number>,
  labelMap: Record<string, { en: string; ar: string }>,
  isAr: boolean,
  order: string[]
): DashboardChartPoint[] {
  return order
    .filter((key) => (counts[key] ?? 0) > 0)
    .map((key) => ({
      key,
      label: isAr ? labelMap[key].ar : labelMap[key].en,
      value: counts[key] ?? 0,
    }));
}

const ATTENDANCE_STATUS_LABELS: Record<
  string,
  { en: string; ar: string }
> = {
  present: { en: "Present", ar: "حاضر" },
  absent: { en: "Absent", ar: "غائب" },
  justified: { en: "Justified", ar: "مبرر" },
};

const JUSTIFICATION_STATUS_LABELS: Record<
  string,
  { en: string; ar: string }
> = {
  pending: { en: "Pending", ar: "قيد المراجعة" },
  accepted: { en: "Accepted", ar: "مقبول" },
  refused: { en: "Refused", ar: "مرفوض" },
};

function countSessionsByDate(
  sessions: { date?: string }[]
): Map<string, number> {
  const map = new Map<string, number>();
  const allowed = new Set(last7DayIsoDates());
  for (const s of sessions) {
    const d = s.date;
    if (typeof d !== "string" || !allowed.has(d)) continue;
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return map;
}

function countAttendanceByStatus(
  rows: { status?: string }[]
): Record<string, number> {
  const counts: Record<string, number> = {
    present: 0,
    absent: 0,
    justified: 0,
  };
  for (const row of rows) {
    const s = String(row.status ?? "").toLowerCase();
    if (s in counts) counts[s] += 1;
  }
  return counts;
}

function countJustificationsByStatus(
  rows: Record<string, unknown>[]
): Record<string, number> {
  const counts: Record<string, number> = {
    pending: 0,
    accepted: 0,
    refused: 0,
  };
  for (const row of rows) {
    const s = String(row.status ?? "").toLowerCase();
    if (s in counts) counts[s] += 1;
  }
  return counts;
}

export async function fetchAdminDashboardCharts(
  isAr: boolean
): Promise<AdminLikeDashboardCharts> {
  const apiBase = getApiBaseUrl();
  const headers = listHeaders();
  const empty: AdminLikeDashboardCharts = {
    overview: [],
    sessionsTrend: buildLast7DayTrend(new Map(), isAr),
    attendanceByStatus: [],
  };

  try {
    const [metrics, sessions, attendance] = await Promise.all([
      fetchAdminLikeDashboardMetrics(),
      loadDrfListAll<{ date?: string }>(
        apiBase,
        `${checkinPath.attendance.sessions}/`,
        headers,
        {}
      ).catch(() => [] as { date?: string }[]),
      loadDrfListAll<{ status?: string }>(
        apiBase,
        `${checkinPath.attendance.attendance}/`,
        headers,
        {}
      ).catch(() => [] as { status?: string }[]),
    ]);

    return {
      overview: [
        {
          key: "teachers",
          label: isAr ? "الأساتذة" : "Professors",
          value: metrics.teachers,
        },
        {
          key: "students",
          label: isAr ? "الطلاب" : "Students",
          value: metrics.students,
        },
        {
          key: "schedules",
          label: isAr ? "الجداول" : "Schedules",
          value: metrics.schedules,
        },
        {
          key: "sessionsToday",
          label: isAr ? "حصص اليوم" : "Sessions today",
          value: metrics.sessionsToday,
        },
      ],
      sessionsTrend: buildLast7DayTrend(
        countSessionsByDate(sessions),
        isAr
      ),
      attendanceByStatus: statusToChartPoints(
        countAttendanceByStatus(attendance),
        ATTENDANCE_STATUS_LABELS,
        isAr,
        ["present", "absent", "justified"]
      ),
    };
  } catch {
    return empty;
  }
}

export async function fetchSchoolingDashboardCharts(
  isAr: boolean
): Promise<SchoolingDashboardCharts> {
  const empty: SchoolingDashboardCharts = {
    reviewWorkload: [],
    justificationsByStatus: [],
    teacherAbsenceByStatus: [],
  };

  try {
    const stats = await fetchAdminTotalsStats();
    if (!stats?.schooling) return empty;

    const { justifications: just, teacher_absence_requests: prof } =
      stats.schooling;

    return {
      reviewWorkload: [
        {
          key: "justPending",
          label: isAr ? "مبررات معلّقة" : "Pending justifications",
          value: just.pending,
        },
        {
          key: "profPending",
          label: isAr ? "غياب أساتذة معلّق" : "Pending prof. absences",
          value: prof.pending,
        },
        {
          key: "justAccepted",
          label: isAr ? "مبررات مقبولة" : "Accepted justifications",
          value: just.accepted,
        },
        {
          key: "justRefused",
          label: isAr ? "مبررات مرفوضة" : "Refused justifications",
          value: just.refused,
        },
      ].filter((p) => p.value > 0),
      justificationsByStatus: statusToChartPoints(
        {
          pending: just.pending,
          accepted: just.accepted,
          refused: just.refused,
        },
        JUSTIFICATION_STATUS_LABELS,
        isAr,
        ["pending", "accepted", "refused"]
      ),
      teacherAbsenceByStatus: statusToChartPoints(
        {
          pending: prof.pending,
          accepted: prof.accepted,
          refused: prof.refused,
        },
        JUSTIFICATION_STATUS_LABELS,
        isAr,
        ["pending", "accepted", "refused"]
      ),
    };
  } catch {
    return empty;
  }
}

export async function fetchProfessorDashboardCharts(
  isAr: boolean
): Promise<ProfessorDashboardCharts> {
  const empty: ProfessorDashboardCharts = {
    overview: [],
    sessionsTrend: buildLast7DayTrend(new Map(), isAr),
    exclusionStatus: [],
  };

  try {
    const [metrics, bundle, students, exclusions] = await Promise.all([
      fetchProfessorDashboardMetrics(isAr),
      loadProfessorSessionData(isAr),
      loadDrfListAll<StudentListRow>(
        getApiBaseUrl(),
        `${checkinPath.students}/`,
        listHeaders(),
        {}
      ).catch(() => [] as StudentListRow[]),
      loadStudentExclusions().catch(() => []),
    ]);
    const professorGroups = new Set(
      bundle.assignments
        .map((a) => a.group)
        .filter((g): g is number => typeof g === "number")
    );
    const rosterEmails = new Set<string>();
    for (const student of students) {
      if (typeof student.group !== "number" || !professorGroups.has(student.group)) {
        continue;
      }
      if (student.email?.trim()) rosterEmails.add(student.email.trim().toLowerCase());
    }
    const excludedEmails = new Set(
      exclusions
        .map((row) => row.student_email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email && rosterEmails.has(email)))
    );
    const excluded = excludedEmails.size;
    const notExcluded = Math.max(0, rosterEmails.size - excluded);

    return {
      overview: [
        {
          key: "sessionsToday",
          label: isAr ? "حصص اليوم" : "Sessions today",
          value: metrics.sessionsToday,
        },
        {
          key: "yourStudents",
          label: isAr ? "طلابك" : "Your students",
          value: metrics.yourStudents,
        },
        {
          key: "activeSchedules",
          label: isAr ? "جداول نشطة" : "Active schedules",
          value: metrics.activeSchedules,
        },
        {
          key: "roomsInUse",
          label: isAr ? "قاعات مرتبطة" : "Rooms in use",
          value: metrics.roomsInUse,
        },
      ],
      sessionsTrend: buildLast7DayTrend(
        countSessionsByDate(bundle.sessions),
        isAr
      ),
      exclusionStatus: [
        {
          key: "excluded",
          label: isAr ? "مستبعد" : "Excluded",
          value: excluded,
        },
        {
          key: "notExcluded",
          label: isAr ? "غير مستبعد" : "Not excluded",
          value: notExcluded,
        },
      ],
    };
  } catch {
    return empty;
  }
}

export async function fetchStudentDashboardCharts(
  isAr: boolean
): Promise<StudentDashboardCharts> {
  const { start: wStart, end: wEnd } = sundayStartWeekIsoBounds();
  const empty: StudentDashboardCharts = {
    justificationsByStatus: [],
    absencesTrend: [],
    absencesByModule: [],
  };

  try {
    const [justRows, modRes, dateRes] = await Promise.all([
      loadStudentJustificationsList().catch(
        () => [] as Record<string, unknown>[]
      ),
      fetchStudentAbsencesByModule().catch(() => null as Response | null),
      fetchStudentAbsencesByDate().catch(() => null as Response | null),
    ]);

    const justificationsByStatus = statusToChartPoints(
      countJustificationsByStatus(justRows),
      JUSTIFICATION_STATUS_LABELS,
      isAr,
      ["pending", "accepted", "refused"]
    );

    const weekDates = last7DayIsoDates().filter(
      (d) => d >= wStart && d <= wEnd
    );
    const absencesByDay = new Map<string, number>();
    for (const d of weekDates) absencesByDay.set(d, 0);

    if (dateRes?.ok) {
      try {
        const raw: unknown = await dateRes.json();
        const arr = unwrapList<{ date?: string }>(raw);
        for (const row of arr) {
          const d = row.date;
          if (typeof d !== "string" || d < wStart || d > wEnd) continue;
          absencesByDay.set(d, (absencesByDay.get(d) ?? 0) + 1);
        }
      } catch {
        /* ignore */
      }
    }

    const absencesTrend: DashboardTrendPoint[] = weekDates.map((date) => ({
      date,
      day: weekdayLabel(date, isAr),
      value: absencesByDay.get(date) ?? 0,
    }));

    const moduleRows: DashboardChartPoint[] = [];
    if (modRes?.ok) {
      try {
        const raw: unknown = await modRes.json();
        const arr = Array.isArray(raw) ? raw : [];
        const sorted = [...arr].sort((a, b) => {
          const ac = (a as { absence_count?: number }).absence_count ?? 0;
          const bc = (b as { absence_count?: number }).absence_count ?? 0;
          return bc - ac;
        });
        for (const row of sorted.slice(0, 6)) {
          const rec = row as {
            session__assignment__module__name?: string;
            absence_count?: number;
          };
          const name = rec.session__assignment__module__name;
          const count = rec.absence_count;
          if (typeof name !== "string" || typeof count !== "number") continue;
          const key = name.replace(/\s+/g, "_").slice(0, 24);
          moduleRows.push({
            key,
            label: name,
            value: count,
            severity: getAbsenceSeverity(count),
          });
        }
      } catch {
        /* ignore */
      }
    }

    return {
      justificationsByStatus,
      absencesTrend,
      absencesByModule: moduleRows,
    };
  } catch {
    return empty;
  }
}
