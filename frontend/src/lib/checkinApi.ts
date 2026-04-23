import { getApiBaseUrl } from "./apiBase";

/**
 * All HTTP routes exposed by `Checkin_backend` (relative to the API origin, no
 * leading slash). Use with `getApiBaseUrl()`: `` `${getApiBaseUrl()}/${path}` `` and
 * DRF’s usual trailing slash, or the `api()` helper in `lib/api.ts` (pass the same
 * string without a leading `/`).
 *
 * The frontend-only notifications feature uses `/api/notifications/` — that route is
 * **not** implemented in this backend; `notificationsApi.ts` handles that separately.
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
  /** `documents` app — schedule PDFs */
  documents: "api/documents",
  document: (id: string | number) => `api/documents/${id}` as const,
} as const;

/** `http(s)://host[:port]/api/.../` with an optional `?` query (DRF-style). */
export function checkinAbsoluteUrl(
  p: string,
  query?: Record<string, string | number | boolean | undefined>
): string {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const path = p.replace(/^\//, "").replace(/\/+$/, "");
  const q = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      q.set(k, String(v));
    }
  }
  const qs = q.toString();
  const url = `${base}/${path}/`;
  return qs ? `${url}?${qs}` : url;
}
