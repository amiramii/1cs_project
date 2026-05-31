import { getAccessToken, getStoredUserEmail } from "@/lib/tokenStorage";
import { isNetworkFailure } from "@/lib/fetchErrors";
import { buildApiAbsoluteUrl, getApiBaseUrl } from "@/lib/apiBase";
import { checkinPath } from "@/lib/checkinApi";
import {
  drfPaginationNext,
  loadDrfListAll,
  resolveAgainstApiBase,
  unwrapList,
} from "@/lib/drfPaginatedList";
import { hydrateAttendanceRowsStudentInfo } from "@/lib/attendanceStudentHydrate";

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
  room?: string;
  extra_fields?: string[];
  module_name?: string;
  group_name?: string;
  /** If present on list/detail payloads (for derived assignment labels). */
  year_name?: string;
  semester?: string;
  attendances?: AttendanceRow[];
};

export type AssignmentApi = {
  id: number;
  /** Teaching-assignment module FK — used for exclusions API. */
  module?: number;
  /** Teaching-assignment group FK — used for roster / dashboard counts. */
  group?: number;
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
/** `/api/teachers/` rows embed `assignments` (same shape as teaching-assignments). */
type TeacherListRow = {
  id: number;
  email?: string;
  assignments?: RawTeachingAssignment[];
};

function normalizeEmailForMatch(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/**
 * Union of `/api/academic/teaching-assignments/` and nested `Teacher.assignments`
 * so brand-new assignments that only appear on the teacher payload still show up.
 */
function mergeTeachingAssignmentsLists(
  fromEndpoint: RawTeachingAssignment[],
  fromTeacher?: TeacherListRow | null
): RawTeachingAssignment[] {
  const byId = new Map<number, RawTeachingAssignment>();
  for (const ta of fromEndpoint) {
    if (typeof ta.id !== "number") continue;
    byId.set(ta.id, ta);
  }
  const embedded = fromTeacher?.assignments;
  if (fromTeacher && Array.isArray(embedded)) {
    for (const ta of embedded) {
      if (!ta || typeof ta.id !== "number") continue;
      if (byId.has(ta.id)) continue;
      if (typeof ta.group !== "number" || typeof ta.module !== "number") continue;
      byId.set(ta.id, {
        id: ta.id,
        teacher:
          typeof ta.teacher === "number" ? ta.teacher : fromTeacher.id,
        group: ta.group,
        module: ta.module,
        year:
          typeof ta.year === "string" ? ta.year : undefined,
        semester:
          typeof ta.semester === "string" ? ta.semester : undefined,
      });
    }
  }
  return [...byId.values()];
}

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
    const groupName = gn?.trim() || `Group #${ra.group}`;
    const moduleName = mn?.trim() || `Module #${ra.module}`;
    out.push({
      id: ra.id,
      module: typeof ra.module === "number" ? ra.module : undefined,
      group: typeof ra.group === "number" ? ra.group : undefined,
      group_name: groupName,
      module_name: moduleName,
      ...(typeof ra.year === "string" && ra.year.trim()
        ? { year_name: ra.year.trim() }
        : {}),
      ...(typeof ra.semester === "string" && ra.semester.trim()
        ? { semester: ra.semester.trim() }
        : {}),
    });
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
 * session list. Flat rows carry the authoritative `status` / `extra_values`
 * after PATCH; nested session payloads can lag or omit merges — prefer flat,
 * attach `session` from nested when missing.
 */
function mergeAttendanceWithSessionInfo(
  flatRows: AttendanceRow[],
  fromSessions: Map<number, AttendanceRow>
): AttendanceRow[] {
  if (fromSessions.size === 0) return flatRows;
  const seen = new Set<number>();
  const out: AttendanceRow[] = [];
  for (const r of flatRows) {
    const nested = fromSessions.get(r.id);
    if (!nested) {
      out.push(r);
      seen.add(r.id);
      continue;
    }
    out.push({
      ...nested,
      ...r,
      session: nested.session ?? r.session,
      student_name: r.student_name ?? nested.student_name,
      student_email: r.student_email ?? nested.student_email,
    });
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
  user_id?: unknown;
  full_name?: unknown;
  email?: unknown;
};

function coercePosInt(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && Number.isInteger(v) && v > 0
    ? v
    : null;
}

/**
 * Map Student PK → display fields. Note: list `GET /students/` uses `StudentSerializer`
 * fields `user_id`, `full_name`, `email` (no Student `id`), while attendance rows use
 * `student` = Student PK — keys rarely match; callers should hydrate rows via
 * `hydrateAttendanceRowsStudentInfo` when names/emails are needed.
 */
function buildStudentNameEmailLookup(
  students: StudentListRecord[]
): Map<number, { student_name: string; student_email: string }> {
  const m = new Map<
    number,
    { student_name: string; student_email: string }
  >();
  for (const s of students) {
    const entry = {
      student_name:
        typeof s.full_name === "string" ? s.full_name : "—",
      student_email: typeof s.email === "string" ? s.email : "",
    };
    const pk = coercePosInt(s.id);
    const uid = coercePosInt(s.user_id);
    if (pk != null) m.set(pk, entry);
    if (uid != null && uid !== pk) m.set(uid, entry);
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

/** When secondary list requests fail, still expose session nested attendances plus derived assignment labels. */
function buildFallbackProfessorBundle(
  sessionsList: SessionApi[]
): ProfessorSessionBundle {
  const fromSessions = attendanceRowsWithSessionFromSessions(sessionsList);
  const teacherAttendanceRows = mergeAttendanceWithSessionInfo(
    [],
    fromSessions
  );
  return {
    sessions: sessionsList,
    teacherAttendanceRows,
    assignments: deriveAssignmentsFromSessions(sessionsList),
    assignmentsCatalogFallback: true,
    sessionsFetchDegraded: false,
  };
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

/** List endpoint often omits nested attendances; detail GET has full roster + marks. */
async function hydrateSessionsWithDetails(
  sessions: SessionApi[],
  headers: HeadersInit,
  cacheBust: boolean
): Promise<SessionApi[]> {
  const fetchInit: RequestInit = {
    headers,
    ...(cacheBust ? { cache: "no-store" as RequestCache } : {}),
  };
  return Promise.all(
    sessions.map(async (session) => {
      try {
        const res = await fetch(
          buildApiAbsoluteUrl(checkinPath.attendance.session(session.id)),
          fetchInit
        );
        if (!res.ok) return session;
        return (await res.json()) as SessionApi;
      } catch {
        return session;
      }
    })
  );
}

export type ProfessorSessionBundle = {
  sessions: SessionApi[];
  teacherAttendanceRows: AttendanceRow[];
  assignments: AssignmentApi[];
  assignmentsCatalogFallback: boolean;
  /** True when GET /sessions returned a non-OK response — list is empty but the rest of the dashboard still loads. */
  sessionsFetchDegraded?: boolean;
};

/**
 * Loads the same bundle as the professor `Sessions` view (for reuse on the
 * semestrial sheet page, etc.).
 */
export async function loadProfessorSessionData(
  isAr: boolean,
  options?: { cacheBust?: boolean }
): Promise<ProfessorSessionBundle> {
  const apiBase = getApiBaseUrl();
  await deferOneFrame();
  let token = await waitForAccessToken(2500);
  let headers = authHeaders(token);
  const sessionsParams = new URLSearchParams();
  sessionsParams.set("page_size", String(API_LIST_PAGE_SIZE));
  if (options?.cacheBust) {
    sessionsParams.set("_", String(Date.now()));
  }
  const sessionsUrl = buildApiAbsoluteUrl(
    checkinPath.attendance.sessions,
    sessionsParams
  );

  let sessionsList: SessionApi[] = [];
  /** True once we get any non-401 response (auth accepted or explicit failure). */
  let reachedAuthenticatedFetch = false;
  let sessionsFetchDegraded = false;

  try {
    sessionFetch: for (let attempt = 0; attempt < 4; attempt++) {
      const sRes = await fetch(sessionsUrl, { headers });
      if (sRes.status === 401) {
        await new Promise((r) => setTimeout(r, 120 + attempt * 180));
        token = await waitForAccessToken(600);
        headers = authHeaders(token);
        continue;
      }
      reachedAuthenticatedFetch = true;

      if (!sRes.ok) {
        if (process.env.NODE_ENV === "development") {
          const errBody = await sRes.text().catch(() => "");
          console.warn(
            "[loadProfessorSessionData] GET sessions (degraded to empty list):",
            sRes.status,
            errBody.slice(0, 500)
          );
        } else {
          await sRes.text().catch(() => {});
        }
        sessionsList = [];
        sessionsFetchDegraded = true;
        break sessionFetch;
      }

      const sText = await sRes.text();
      let sParsed: unknown = null;
      try {
        sParsed = sText ? JSON.parse(sText) : null;
      } catch {
        sessionsList = [];
        sessionsFetchDegraded = true;
        break sessionFetch;
      }
      sessionsList = unwrapList<SessionApi>(sParsed);
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

      break sessionFetch;
    }

    if (!reachedAuthenticatedFetch) {
      throw new Error(
        isAr
          ? "تعذر التحقق من الجلسة. سجّل الخروج ثم الدخول من جديد."
          : "Could not verify your session. Please sign in again."
      );
    }

    try {
        const [
          attMerged,
          groupRows,
          moduleRows,
          rawTas,
          teacherRows,
          studentListRows,
        ] = await Promise.all([
          (async () => {
            const attParams = new URLSearchParams();
            attParams.set("page_size", String(API_LIST_PAGE_SIZE));
            if (options?.cacheBust) {
              attParams.set("_", String(Date.now()));
            }
            const first = await fetch(
              buildApiAbsoluteUrl(checkinPath.attendance.attendance, attParams),
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
          loadDrfListAll<TeacherListRow>(
            apiBase,
            `${checkinPath.teachers}/`,
            headers,
            {}
          ),
          loadDrfListAll<StudentListRecord>(
            apiBase,
            `${checkinPath.students}/`,
            headers,
            {}
          ),
        ]);

        const groupById = new Map(
          groupRows.map((g) => [g.id, g.name] as [number, string])
        );
        const modById = new Map(
          moduleRows.map((m) => [m.id, m.name] as [number, string])
        );
        const storedEmailNorm = normalizeEmailForMatch(getStoredUserEmail());
        const teacherRow = storedEmailNorm
          ? teacherRows.find(
              (t) =>
                normalizeEmailForMatch(t.email) === storedEmailNorm
            )
          : undefined;
        const teacherId = teacherRow?.id;
        const mergedTas = mergeTeachingAssignmentsLists(rawTas, teacherRow);
        const sessionAssignmentIds = new Set(
          sessionsList
            .map((s) => s.assignment)
            .filter((x): x is number => typeof x === "number")
        );
        let rawRows: RawTeachingAssignment[] = [];
        if (typeof teacherId === "number") {
          rawRows = mergedTas.filter((ta) => ta.teacher === teacherId);
        } else {
          rawRows = mergedTas.filter((ta) => sessionAssignmentIds.has(ta.id));
        }
        let resolved: AssignmentApi[] = buildResolvedAssignments(
          rawRows,
          groupById,
          modById
        );
        if (resolved.length === 0) {
          rawRows = mergedTas.filter((ta) => sessionAssignmentIds.has(ta.id));
          resolved = buildResolvedAssignments(rawRows, groupById, modById);
        }
        if (resolved.length === 0) {
          resolved = deriveAssignmentsFromSessions(sessionsList);
        }
        const assignmentIds = new Set(resolved.map((a) => a.id));
        const sessionsForSheet = sessionsList.filter((s) =>
          assignmentIds.has(s.assignment)
        );
        const sessionsHydrated = await hydrateSessionsWithDetails(
          sessionsForSheet,
          headers,
          Boolean(options?.cacheBust)
        );
        const sessionsById = new Map(
          sessionsHydrated.map((s) => [s.id, s] as const)
        );
        const sessionsMerged = sessionsList.map(
          (s) => sessionsById.get(s.id) ?? s
        );
        const withSession = mergeAttendanceWithSessionInfo(
          attMerged,
          attendanceRowsWithSessionFromSessions(sessionsMerged)
        );
        const studentLookup = buildStudentNameEmailLookup(studentListRows);
        const teacherAttendanceRows = await hydrateAttendanceRowsStudentInfo(
          applyStudentLookup(withSession, studentLookup)
        );
        return {
          sessions: sessionsMerged,
          teacherAttendanceRows,
          assignments: resolved,
          assignmentsCatalogFallback: typeof teacherId !== "number",
          sessionsFetchDegraded,
        };
    } catch (e) {
        console.warn("[loadProfessorSessionData] secondary load failed:", e);
        const fb = buildFallbackProfessorBundle(sessionsList);
        const teacherAttendanceRows =
          await hydrateAttendanceRowsStudentInfo(fb.teacherAttendanceRows);
        return {
          ...fb,
          teacherAttendanceRows,
          sessionsFetchDegraded,
        };
    }
  } catch (e) {
    if (isNetworkFailure(e) && process.env.NODE_ENV === "development") {
      console.warn("[loadProfessorSessionData] network error:", e);
    }
    throw e;
  }
}
