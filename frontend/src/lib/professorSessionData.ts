import { getAccessToken, getStoredUserEmail } from "@/lib/tokenStorage";
import { apiUnreachableMessage, isNetworkFailure } from "@/lib/fetchErrors";
import { getApiBaseUrl } from "@/lib/apiBase";
import { checkinPath } from "@/lib/checkinApi";
import {
  drfPaginationNext,
  loadDrfListAll,
  resolveAgainstApiBase,
  unwrapList,
} from "@/lib/drfPaginatedList";

export type AttendanceStatus = "present" | "absent" | "justified";

/** Stored in API `Attendance.extra_values` (shallow-merged on PATCH). */
export type AttendanceExtraValues = {
  participation_points?: number;
  professor_note?: string;
  [k: string]: unknown;
};

export type AttendanceRow = {
  id: number;
  session?: number;
  student: number;
  student_name?: string;
  student_email?: string;
  status: AttendanceStatus;
  extra_values?: AttendanceExtraValues;
};

export type SessionApi = {
  id: number;
  assignment: number;
  date: string;
  start_time: string;
  end_time: string;
  module_name?: string;
  group_name?: string;
  /** If present on list/detail payloads (for derived assignment labels). */
  year_name?: string;
  semester?: string;
  attendances?: AttendanceRow[];
};

export type AssignmentApi = {
  id: number;
  group_name?: string;
  module_name?: string;
  /** From teaching-assignment `year` (module academic year name), e.g. "1CS". */
  year_name?: string;
  /** From teaching-assignment `semester`, e.g. "S1" | "S2". */
  semester?: string;
};

type RawTeachingAssignment = {
  id: number;
  teacher: number;
  group: number;
  module: number;
  /** DRF: `module.year.name` */
  year?: string;
  /** DRF: `module.semester` (e.g. S1 / S2) */
  semester?: string;
};

type GroupRow = { id: number; name: string };
type ModuleRow = { id: number; name: string };
type TeacherListRow = { id: number; email?: string };

const API_LIST_PAGE_SIZE = 50;

function buildResolvedAssignments(
  rawRows: RawTeachingAssignment[],
  groupById: Map<number, string>,
  modById: Map<number, string>
): AssignmentApi[] {
  const out: AssignmentApi[] = [];
  for (const ra of rawRows) {
    const gn = groupById.get(ra.group);
    const mn = modById.get(ra.module);
    if (gn && mn) {
      out.push({
        id: ra.id,
        group_name: gn,
        module_name: mn,
        ...(typeof ra.year === "string" && ra.year.trim()
          ? { year_name: ra.year.trim() }
          : {}),
        ...(typeof ra.semester === "string" && ra.semester.trim()
          ? { semester: ra.semester.trim() }
          : {}),
      });
    }
  }
  return out.sort((a, b) => a.id - b.id);
}

/**
 * Django's flat `AttendanceSerializer` does not include `session`, but nested
 * attendances on each session are the same records — we attach `session` here
 * so session history and matrix logic can group rows correctly.
 */
function attendanceRowsWithSessionFromSessions(
  sessions: SessionApi[]
): Map<number, AttendanceRow> {
  const byId = new Map<number, AttendanceRow>();
  for (const s of sessions) {
    const sid = s.id;
    for (const r of s.attendances ?? []) {
      if (typeof r.id !== "number") continue;
      byId.set(r.id, { ...r, session: sid });
    }
  }
  return byId;
}

/**
 * Merges flat `/api/attendance/attendance/` rows with session ids from the
 * session list; nested data wins for duplicate ids.
 */
function mergeAttendanceWithSessionInfo(
  flatRows: AttendanceRow[],
  fromSessions: Map<number, AttendanceRow>
): AttendanceRow[] {
  if (fromSessions.size === 0) return flatRows;
  const seen = new Set<number>();
  const out: AttendanceRow[] = [];
  for (const r of flatRows) {
    const merged = fromSessions.get(r.id) ?? r;
    out.push(merged);
    seen.add(r.id);
  }
  for (const [id, row] of fromSessions) {
    if (seen.has(id)) continue;
    out.push(row);
  }
  return out;
}

type StudentListRecord = {
  id?: unknown;
  full_name?: unknown;
  email?: unknown;
};

function buildStudentNameEmailLookup(
  students: StudentListRecord[]
): Map<number, { student_name: string; student_email: string }> {
  const m = new Map<
    number,
    { student_name: string; student_email: string }
  >();
  for (const s of students) {
    if (typeof s.id !== "number") continue;
    m.set(s.id, {
      student_name:
        typeof s.full_name === "string" ? s.full_name : "—",
      student_email: typeof s.email === "string" ? s.email : "",
    });
  }
  return m;
}

function applyStudentLookup(
  rows: AttendanceRow[],
  lookup: Map<number, { student_name: string; student_email: string }>
): AttendanceRow[] {
  if (lookup.size === 0) return rows;
  return rows.map((r) => {
    const st =
      typeof r.student === "number" ? lookup.get(r.student) : undefined;
    if (!st) return r;
    return {
      ...r,
      student_name: r.student_name ?? st.student_name,
      student_email: r.student_email ?? st.student_email,
    };
  });
}

function deriveAssignmentsFromSessions(
  sessions: SessionApi[]
): AssignmentApi[] {
  const byId = new Map<number, AssignmentApi>();
  for (const s of sessions) {
    const id = s.assignment;
    if (typeof id !== "number") continue;
    const prev = byId.get(id);
    if (!prev) {
      byId.set(id, {
        id,
        group_name: s.group_name,
        module_name: s.module_name,
        year_name: s.year_name,
        semester: s.semester,
      });
    } else {
      byId.set(id, {
        ...prev,
        group_name: prev.group_name ?? s.group_name,
        module_name: prev.module_name ?? s.module_name,
        year_name: prev.year_name ?? s.year_name,
        semester: prev.semester ?? s.semester,
      });
    }
  }
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

async function waitForAccessToken(maxWaitMs = 500): Promise<string | null> {
  const immediate = getAccessToken();
  if (immediate?.trim()) return immediate;
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 50));
    const t = getAccessToken();
    if (t?.trim()) return t;
  }
  return getAccessToken();
}

async function deferOneFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    requestAnimationFrame(() => resolve());
  });
}

function authHeaders(token: string | null): HeadersInit {
  return token?.trim() ? { Authorization: `Bearer ${token.trim()}` } : {};
}

export type ProfessorSessionBundle = {
  sessions: SessionApi[];
  teacherAttendanceRows: AttendanceRow[];
  assignments: AssignmentApi[];
  assignmentsCatalogFallback: boolean;
};

/**
 * Loads the same bundle as the professor `Sessions` view (for reuse on the
 * semestrial sheet page, etc.).
 */
export async function loadProfessorSessionData(
  isAr: boolean
): Promise<ProfessorSessionBundle> {
  const apiBase = getApiBaseUrl();
  await deferOneFrame();
  let token = await waitForAccessToken(2500);
  let headers = authHeaders(token);
  const sessionsUrl = `${apiBase}/${checkinPath.attendance.sessions}/?page_size=${API_LIST_PAGE_SIZE}`;

  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const sRes = await fetch(sessionsUrl, { headers });
      if (sRes.status === 401) {
        await new Promise((r) => setTimeout(r, 120 + attempt * 180));
        token = await waitForAccessToken(600);
        headers = authHeaders(token);
        continue;
      }
      if (!sRes.ok) {
        throw new Error(
          isAr ? "تعذر تحميل الحصص." : "Could not load sessions."
        );
      }
      const sText = await sRes.text();
      let sParsed: unknown = null;
      try {
        sParsed = sText ? JSON.parse(sText) : null;
      } catch {
        sParsed = null;
      }
      let sessionsList: SessionApi[] = unwrapList<SessionApi>(sParsed);
      let nextS = drfPaginationNext(sParsed);
      let sGuard = 0;
      while (nextS && sGuard < 40) {
        sGuard += 1;
        const resolved = resolveAgainstApiBase(apiBase, nextS);
        const s2 = await fetch(resolved, { headers });
        if (!s2.ok) break;
        const t2 = await s2.text();
        let s2p: unknown = null;
        try {
          s2p = t2 ? JSON.parse(t2) : null;
        } catch {
          break;
        }
        sessionsList = sessionsList.concat(unwrapList<SessionApi>(s2p));
        nextS = drfPaginationNext(s2p);
      }

      const [
        attMerged,
        groupRows,
        moduleRows,
        rawTas,
        teacherRows,
        studentListRows,
      ] = await Promise.all([
        (async () => {
          const first = await fetch(
            `${apiBase}/${checkinPath.attendance.attendance}/?page_size=${API_LIST_PAGE_SIZE}`,
            { headers }
          );
          if (!first.ok) return [] as AttendanceRow[];
          const raw = await first.text();
          let p0: unknown = null;
          try {
            p0 = raw ? JSON.parse(raw) : null;
          } catch {
            return [] as AttendanceRow[];
          }
          const merged: AttendanceRow[] = [...unwrapList<AttendanceRow>(p0)];
          let nextA = drfPaginationNext(p0);
          let g = 0;
          while (nextA && g < 40) {
            g += 1;
            const r2 = await fetch(resolveAgainstApiBase(apiBase, nextA), {
              headers,
            });
            if (!r2.ok) break;
            const t2 = await r2.text();
            let p2: unknown = null;
            try {
              p2 = t2 ? JSON.parse(t2) : null;
            } catch {
              break;
            }
            merged.push(...unwrapList<AttendanceRow>(p2));
            nextA = drfPaginationNext(p2);
          }
          return merged;
        })(),
        loadDrfListAll<GroupRow>(
          apiBase,
          `${checkinPath.academic.groups}/`,
          headers,
          {}
        ),
        loadDrfListAll<ModuleRow>(
          apiBase,
          `${checkinPath.academic.modules}/`,
          headers,
          {}
        ),
        loadDrfListAll<RawTeachingAssignment>(
          apiBase,
          `${checkinPath.academic.teachingAssignments}/`,
          headers,
          {}
        ),
        loadDrfListAll<TeacherListRow>(apiBase, `${checkinPath.teachers}/`, headers, {}),
        loadDrfListAll<StudentListRecord>(apiBase, `${checkinPath.students}/`, headers, {}),
      ]);

      const groupById = new Map(
        groupRows.map((g) => [g.id, g.name] as [number, string])
      );
      const modById = new Map(
        moduleRows.map((m) => [m.id, m.name] as [number, string])
      );
      const email = getStoredUserEmail();
      const teacherRow = email
        ? teacherRows.find(
            (t) => (t.email ?? "").toLowerCase() === email
          )
        : undefined;
      const teacherId = teacherRow?.id;
      const sessionAssignmentIds = new Set(
        sessionsList
          .map((s) => s.assignment)
          .filter((x): x is number => typeof x === "number")
      );
      let rawRows: RawTeachingAssignment[] = [];
      if (typeof teacherId === "number") {
        rawRows = rawTas.filter((ta) => ta.teacher === teacherId);
      } else {
        rawRows = rawTas.filter((ta) => sessionAssignmentIds.has(ta.id));
      }
      let resolved: AssignmentApi[] = buildResolvedAssignments(
        rawRows,
        groupById,
        modById
      );
      if (resolved.length === 0) {
        rawRows = rawTas.filter((ta) => sessionAssignmentIds.has(ta.id));
        resolved = buildResolvedAssignments(rawRows, groupById, modById);
      }
      if (resolved.length === 0) {
        resolved = deriveAssignmentsFromSessions(sessionsList);
      }
      const withSession = mergeAttendanceWithSessionInfo(
        attMerged,
        attendanceRowsWithSessionFromSessions(sessionsList)
      );
      const studentLookup = buildStudentNameEmailLookup(studentListRows);
      const teacherAttendanceRows = applyStudentLookup(
        withSession,
        studentLookup
      );
      return {
        sessions: sessionsList,
        teacherAttendanceRows,
        assignments: resolved,
        assignmentsCatalogFallback: typeof teacherId !== "number",
      };
    }
  } catch (e) {
    if (isNetworkFailure(e)) {
      throw new Error(apiUnreachableMessage(apiBase, isAr));
    }
    throw e;
  }
  throw new Error(
    isAr
      ? "تعذر التحقق من الجلسة. سجّل الخروج ثم الدخول من جديد."
      : "Could not verify your session. Please sign in again."
  );
}
