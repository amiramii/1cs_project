import { buildApiAbsoluteUrl } from "./apiBase";

/**
 * All HTTP routes exposed by `Checkin_backend` (relative to the API origin, no
 * leading slash). Use with `getApiBaseUrl()`: `` `${getApiBaseUrl()}/${path}` `` and
 * DRF’s usual trailing slash, or the `api()` helper in `lib/api.ts` (pass the same
 * string without a leading `/`).
 *
 * Server notifications: `lib/notificationsApi.ts` → `/api/notifications/`.
 *
 * Typed HTTP helpers for every route: `lib/checkinClient.ts` (import from there for calls).
 */
export const checkinPath = {
  /** POST — JWT / SimpleJWT (see `lib/auth.ts`) */
  token: "api/token",
  /** POST */
  tokenRefresh: "api/token/refresh",
  openApi: {
    /** GET — OpenAPI schema (JSON) */
    schema: "api/schema",
    /** GET — Swagger UI */
    docs: "api/docs",
    /** GET — ReDoc */
    redoc: "api/redoc",
  },
  /** ModelViewSet — admin; requires admin for writes */
  users: "api/users",
  user: (id: string | number) => `api/users/${id}` as const,
  /** ModelViewSet — `Student` */
  students: "api/students",
  student: (id: string | number) => `api/students/${id}` as const,
  /** ModelViewSet — `Teacher` */
  teachers: "api/teachers",
  teacher: (id: string | number) => `api/teachers/${id}` as const,
  /** ModelViewSet — `Teacher` */
  schooling: "api/schooling",
  schooler: (id: string | number) => `api/schooling/${id}` as const,
  /** POST `multipart` — bulk CSV (see `StudMidContainer` / `ProfMidContainer`) */
  upload: "api/upload",
  /** POST (AllowAny) */
  resetPasswordRequest: "api/reset-password-request",
  /** POST (AllowAny) */
  resetPassword: "api/reset-password",
  academic: {
    groups: "api/academic/groups",
    group: (id: string | number) => `api/academic/groups/${id}` as const,
    modules: "api/academic/modules",
    module: (id: string | number) => `api/academic/modules/${id}` as const,
    teachingAssignments: "api/academic/teaching-assignments",
    teachingAssignment: (id: string | number) =>
      `api/academic/teaching-assignments/${id}` as const,
    sections: "api/academic/sections",
    section: (id: string | number) => `api/academic/sections/${id}` as const,
    years: "api/academic/years",
    year: (id: string | number) => `api/academic/years/${id}` as const,
  },
  attendance: {
    sessions: "api/attendance/sessions",
    session: (id: string | number) => `api/attendance/sessions/${id}` as const,
    attendance: "api/attendance/attendance",
    attendanceRow: (id: string | number) =>
      `api/attendance/attendance/${id}` as const,
  },
  /**
   * `documents` app — mounted at `/api/documents/`.
   * DRF router registers the `DocumentViewSet` at root (`""`) under that prefix.
   */
  documents: {
    collection: "api/documents",
    detail: (id: string | number) => `api/documents/${id}` as const,
    /** GET `ProfessorTodayView` — `professor` is the display name from the timetable PDFs. */
    scheduleToday: (professor: string) =>
      `api/documents/schedule/today/${encodeURIComponent(professor)}` as const,
  },
  /** `justifications` app — router at `/api/` (`justifications/urls.py`). */
  absences: {
    /** GET `@action(by_module)` */
    byModule: "api/absences/by_module",
    /** GET `@action(by_date)` — returns mini attendance rows (absent slots). */
    byDate: "api/absences/by_date",
  },
  justifications: {
    /** GET list — schooling office or admin (`IsSchoolingOrAdmin`). Students use `myJustifications`. */
    collection: "api/justifications",
    detail: (id: string | number) => `api/justifications/${id}` as const,
    /** GET — student only; same payload shape as list but scoped server-side */
    myJustifications: "api/justifications/my_justifications",
    /** GET — counters by status for current user scope. */
    count: "api/justifications/count",
    accept: (id: string | number) => `api/justifications/${id}/accept` as const,
    refuse: (id: string | number) => `api/justifications/${id}/refuse` as const,
  },
  /** `extra_sessions` app — router at `/api/extra-sessions/` */
  extraSessions: {
    collection: "api/extra-sessions",
    detail: (id: string | number) => `api/extra-sessions/${id}` as const,
    myRequests: "api/extra-sessions/my_requests",
    upcoming: "api/extra-sessions/upcoming",
    accept: (id: string | number) =>
      `api/extra-sessions/${id}/accept` as const,
    refuse: (id: string | number) =>
      `api/extra-sessions/${id}/refuse` as const,
    openSession: (id: string | number) =>
      `api/extra-sessions/${id}/open_session` as const,
  },
  exclusions: {
    collection: "api/exclusions",
    detail: (id: string | number) => `api/exclusions/${id}` as const,
    config: "api/exclusions/config",
    recalculate: "api/exclusions/recalculate",
  },
  /** `teacher_absence` app — router at `/api/teacher-absence/` */
  teacherAbsence: {
    collection: "api/teacher-absence",
    detail: (id: string | number) => `api/teacher-absence/${id}` as const,
    myRequests: "api/teacher-absence/my_requests",
    accept: (id: string | number) =>
      `api/teacher-absence/${id}/accept` as const,
    refuse: (id: string | number) =>
      `api/teacher-absence/${id}/refuse` as const,
  },
  /** `notifications` app — router at `/api/notifications/` */
  notifications: {
    collection: "api/notifications",
    detail: (id: string | number) => `api/notifications/${id}` as const,
    markRead: (id: string | number) =>
      `api/notifications/${id}/mark_read` as const,
    unreadCount: "api/notifications/unread_count",
    broadcast: "api/notifications/broadcast",
  },
} as const;

/** `http(s)://host[:port]/api/.../` with an optional `?` query (DRF-style). */
export function checkinAbsoluteUrl(
  p: string,
  query?: Record<string, string | number | boolean | undefined>
): string {
  const path = p.replace(/^\//, "").replace(/\/+$/, "");
  const q = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      q.set(k, String(v));
    }
  }
  const hasQ = [...q.keys()].length > 0;
  return buildApiAbsoluteUrl(path, hasQ ? q : undefined);
}
