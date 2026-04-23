/**
 * HTTP client for every route exposed by Checkin_backend (`backend/urls.py` + app routers).
 * Paths mirror `lib/checkinApi.ts`; use this module for request bodies and auth, not ad-hoc URLs.
 */
import api from "./api"
import { checkinPath } from "./checkinApi"
import { getApiBaseUrl } from "./apiBase"
import { getAccessToken } from "./tokenStorage"
import { loadDrfListAll } from "./drfPaginatedList"

// --- URL helpers (same pattern as ad-hoc `getApiBaseUrl() + /${checkinPath...}/`) ---

export function checkinUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, "")
  const p = path.replace(/^\/+/, "").replace(/\/+$/, "")
  return `${base}/${p}/`
}

function jsonAuthHeaders(): Record<string, string> {
  const t = getAccessToken()
  return {
    "Content-Type": "application/json",
    ...(t && { Authorization: `Bearer ${t}` }),
  }
}

function listAuthHeaders(): HeadersInit {
  const t = getAccessToken()
  return { ...(t && { Authorization: `Bearer ${t}` }) }
}

// --- auth (JWT) — prefer `lib/auth.ts` for login; listed here for completeness ---

export async function postTokenObtain(
  body: { email: string; password: string; remember_me?: boolean }
) {
  return api(
    checkinPath.token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { withAuth: false }
  )
}

export async function postTokenRefresh(refresh: string) {
  return api(
    checkinPath.tokenRefresh,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    },
    { withAuth: false }
  )
}

// --- `authentication` app (router mounted at /api/) ---

export async function uploadCheckinCsv(
  file: File,
  userType: "student" | "teacher" | "schooling"
): Promise<Response> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("user_type", userType)
  return fetch(checkinUrl(checkinPath.upload), {
    method: "POST",
    headers: listAuthHeaders(),
    body: formData,
  })
}

export function loadAllUsers() {
  return loadDrfListAll(
    getApiBaseUrl(),
    `${checkinPath.users}/`,
    listAuthHeaders(),
    {}
  )
}

export function loadAllStudents() {
  return loadDrfListAll(
    getApiBaseUrl(),
    `${checkinPath.students}/`,
    listAuthHeaders(),
    {}
  )
}

export function loadAllTeachers() {
  return loadDrfListAll(
    getApiBaseUrl(),
    `${checkinPath.teachers}/`,
    listAuthHeaders(),
    {}
  )
}

export async function deleteUserById(
  id: string | number
): Promise<Response> {
  return api(checkinPath.user(id), { method: "DELETE" })
}

export async function deleteStudentById(
  id: string | number
): Promise<Response> {
  return api(checkinPath.student(id), { method: "DELETE" })
}

export async function deleteTeacherById(
  id: string | number
): Promise<Response> {
  return api(checkinPath.teacher(id), { method: "DELETE" })
}

/** @see `StudentCreateSerializer` in backend */
export async function createStudent(body: unknown): Promise<Response> {
  return api(checkinPath.students, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

/** @see `TeacherCreateSerializer` in backend */
export async function createTeacher(body: unknown): Promise<Response> {
  return api(checkinPath.teachers, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export async function postResetPasswordRequest(body: { email: string }): Promise<Response> {
  return api(
    checkinPath.resetPasswordRequest,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { withAuth: false }
  )
}

export async function postResetPasswordComplete(body: {
  uidb64: string
  token: string
  new_password: string
}): Promise<Response> {
  return api(
    checkinPath.resetPassword,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { withAuth: false }
  )
}

// --- academic ---

export function loadAllAcademicGroups() {
  return loadDrfListAll(
    getApiBaseUrl(),
    `${checkinPath.academic.groups}/`,
    listAuthHeaders(),
    {}
  )
}

export function loadAllAcademicModules() {
  return loadDrfListAll(
    getApiBaseUrl(),
    `${checkinPath.academic.modules}/`,
    listAuthHeaders(),
    {}
  )
}

export function loadAllAcademicSections() {
  return loadDrfListAll<{ id: number; name: string }>(
    getApiBaseUrl(),
    `${checkinPath.academic.sections}/`,
    listAuthHeaders(),
    {}
  )
}

export function loadAllAcademicYears() {
  return loadDrfListAll(
    getApiBaseUrl(),
    `${checkinPath.academic.years}/`,
    listAuthHeaders(),
    {}
  )
}

export function loadAllTeachingAssignments() {
  return loadDrfListAll(
    getApiBaseUrl(),
    `${checkinPath.academic.teachingAssignments}/`,
    listAuthHeaders(),
    {}
  )
}

// --- attendance ---

export function loadAllSessions() {
  return loadDrfListAll(
    getApiBaseUrl(),
    `${checkinPath.attendance.sessions}/`,
    listAuthHeaders(),
    {}
  )
}

export function loadAllAttendanceRows() {
  return loadDrfListAll(
    getApiBaseUrl(),
    `${checkinPath.attendance.attendance}/`,
    listAuthHeaders(),
    {}
  )
}

export async function getAttendanceSessionById(
  id: string | number
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.attendance.session(id)), {
    headers: listAuthHeaders(),
  })
}

export async function createAttendanceSession(
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.attendance.sessions), {
    method: "POST",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(body),
  })
}

export async function updateAttendanceSession(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.attendance.session(id)), {
    method: "PUT",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(body),
  })
}

export async function patchAttendanceSession(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.attendance.session(id)), {
    method: "PATCH",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(body),
  })
}

export async function deleteAttendanceSession(
  id: string | number
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.attendance.session(id)), {
    method: "DELETE",
    headers: listAuthHeaders(),
  })
}

export async function patchAttendanceRow(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.attendance.attendanceRow(id)), {
    method: "PATCH",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(body),
  })
}

// --- documents (schedule PDFs) — list can be public; writes need staff JWT ---

export function loadAllDocuments() {
  return loadDrfListAll(
    getApiBaseUrl(),
    `${checkinPath.documents}/`,
    listAuthHeaders(),
    {}
  )
}

/** DRF list with `?audience=` (same as `ScheduleListShell` / student dashboard). */
export async function fetchDocumentsByAudience(
  audience: string
): Promise<Response> {
  return fetch(
    `${checkinUrl(checkinPath.documents)}?audience=${encodeURIComponent(audience)}`,
    { headers: listAuthHeaders() }
  )
}

export async function getDocumentById(
  id: string | number
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.document(id)), {
    headers: listAuthHeaders(),
  })
}

export async function postDocument(formData: FormData): Promise<Response> {
  return fetch(checkinUrl(checkinPath.documents), {
    method: "POST",
    headers: listAuthHeaders(),
    body: formData,
  })
}

export async function patchDocument(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.document(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function putDocument(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.document(id), {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export async function deleteDocument(
  id: string | number
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.document(id)), {
    method: "DELETE",
    headers: listAuthHeaders(),
  })
}

// --- drf-spectacular (read-only) ---

export const openApi = {
  schemaUrl: () => checkinUrl(checkinPath.openApi.schema),
  docsUrl: () => checkinUrl(checkinPath.openApi.docs),
  redocUrl: () => checkinUrl(checkinPath.openApi.redoc),
}
