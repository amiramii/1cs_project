import {
  fetchStudentAbsencesByDate,
  fetchStudentAbsencesByModule,
  loadStudentJustificationsList,
} from "@/lib/checkinClient";
import { getApiBaseUrl } from "@/lib/apiBase";
import { checkinPath } from "@/lib/checkinApi";
import { loadDrfListAll, unwrapList } from "@/lib/drfPaginatedList";
import { loadProfessorSessionData } from "@/lib/professorSessionData";
import { getAccessToken } from "@/lib/tokenStorage";

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
        `${checkinPath.documents.khra}/`,
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
        `${checkinPath.documents.khra}/?audience=teacher`,
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

export async function fetchStudentDashboardMetrics(): Promise<{
  pendingJustifications: number;
  schedulesOnFile: number;
  absenceMarksTotal: number;
  absentSlotsThisWeek: number;
}> {
  const apiBase = getApiBaseUrl();
  const headers = listHeaders();
  const { start: wStart, end: wEnd } = sundayStartWeekIsoBounds();
  try {
    const [justRows, docs, modRes, dateRes] = await Promise.all([
      loadStudentJustificationsList().catch(() => [] as Record<string, unknown>[]),
      loadDrfListAll<DocRow>(
        apiBase,
        `${checkinPath.documents.khra}/?audience=student`,
        headers,
        {}
      ).catch(() => [] as DocRow[]),
      fetchStudentAbsencesByModule().catch(() => null as Response | null),
      fetchStudentAbsencesByDate().catch(() => null as Response | null),
    ]);

    const pendingJustifications = justRows.filter(
      (j) => String(j.status ?? "").toLowerCase() === "pending"
    ).length;

    let absenceMarksTotal = 0;
    if (modRes?.ok) {
      try {
        const raw: unknown = await modRes.json();
        const arr = Array.isArray(raw) ? raw : [];
        for (const row of arr) {
          const rec = row as { absence_count?: unknown };
          const c = rec.absence_count;
          if (typeof c === "number" && Number.isFinite(c))
            absenceMarksTotal += c;
        }
      } catch {
        /* ignore */
      }
    }

    let absentSlotsThisWeek = 0;
    if (dateRes?.ok) {
      try {
        const raw: unknown = await dateRes.json();
        const arr = unwrapList<{ date?: string }>(raw);
        for (const row of arr) {
          const d = row.date;
          if (typeof d !== "string") continue;
          if (d >= wStart && d <= wEnd) absentSlotsThisWeek += 1;
        }
      } catch {
        /* ignore */
      }
    }

    return {
      pendingJustifications,
      schedulesOnFile: docs.length,
      absenceMarksTotal,
      absentSlotsThisWeek,
    };
  } catch {
    return {
      pendingJustifications: 0,
      schedulesOnFile: 0,
      absenceMarksTotal: 0,
      absentSlotsThisWeek: 0,
    };
  }
}
