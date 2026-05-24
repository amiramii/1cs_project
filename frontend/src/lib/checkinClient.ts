/**
 * HTTP client for every route exposed by Checkin_backend (`backend/urls.py` + app routers).
 * Paths mirror `lib/checkinApi.ts`; use this module for request bodies and auth, not ad-hoc URLs.
 */
import api, { attemptTokenRefresh } from "./api"
import { checkinPath } from "./checkinApi"
import { buildApiAbsoluteUrl, getApiBaseUrl } from "./apiBase"
import { getAccessToken } from "./tokenStorage"
import { loadDrfListAll, unwrapList } from "./drfPaginatedList"
import { summarizeUpstreamError } from "./drfError"

// --- URL helpers (same pattern as ad-hoc `getApiBaseUrl() + /${checkinPath...}/`) ---

export function checkinUrl(path: string): string {
  const p = path.replace(/^\/+/, "").replace(/\/+$/, "")
  return buildApiAbsoluteUrl(p)
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

export async function getStudentById(id: string | number): Promise<Response> {
  return api(checkinPath.student(id), { method: "GET" })
}

export async function getTeacherById(id: string | number): Promise<Response> {
  return api(checkinPath.teacher(id), { method: "GET" })
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

export async function getAttendanceRowById(
  id: string | number
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.attendance.attendanceRow(id)), {
    headers: listAuthHeaders(),
  })
}

export async function createAttendanceRow(
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.attendance.attendance), {
    method: "POST",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(body),
  })
}

export async function putAttendanceRow(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.attendance.attendanceRow(id)), {
    method: "PUT",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(body),
  })
}

export async function deleteAttendanceRow(
  id: string | number
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.attendance.attendanceRow(id)), {
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

// --- users (`UserViewSet`, admin) ---

export async function getUserById(id: string | number): Promise<Response> {
  return api(checkinPath.user(id), { method: "GET" })
}

export async function postUser(body: Record<string, unknown>): Promise<Response> {
  return api(checkinPath.users, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function patchUser(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.user(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function putUser(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.user(id), {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

// --- academic (`ModelViewSet` on each resource) ---

export async function postAcademicYear(
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.years, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function patchAcademicYear(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.year(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function putAcademicYear(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.year(id), {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export async function deleteAcademicYear(id: string | number): Promise<Response> {
  return api(checkinPath.academic.year(id), { method: "DELETE" })
}

export async function postAcademicSection(
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.sections, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function patchAcademicSection(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.section(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function putAcademicSection(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.section(id), {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export async function deleteAcademicSection(
  id: string | number
): Promise<Response> {
  return api(checkinPath.academic.section(id), { method: "DELETE" })
}

export async function postAcademicGroup(
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.groups, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function patchAcademicGroup(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.group(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function putAcademicGroup(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.group(id), {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export async function deleteAcademicGroup(
  id: string | number
): Promise<Response> {
  return api(checkinPath.academic.group(id), { method: "DELETE" })
}

export async function postAcademicModule(
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.modules, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function patchAcademicModule(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.module(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function putAcademicModule(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.module(id), {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export async function deleteAcademicModule(
  id: string | number
): Promise<Response> {
  return api(checkinPath.academic.module(id), { method: "DELETE" })
}

export async function postTeachingAssignment(
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.teachingAssignments, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function patchTeachingAssignment(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.teachingAssignment(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function putTeachingAssignment(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.academic.teachingAssignment(id), {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export async function deleteTeachingAssignment(
  id: string | number
): Promise<Response> {
  return api(checkinPath.academic.teachingAssignment(id), {
    method: "DELETE",
  })
}

// --- documents (schedule PDFs) — list can be public; writes need staff JWT ---

export function loadAllDocuments() {
  return loadDrfListAll(
    getApiBaseUrl(),
    `${checkinPath.documents.khra}/`,
    listAuthHeaders(),
    {}
  )
}

/** DRF list with `?audience=` (same as `ScheduleListShell` / student dashboard). */
export async function fetchDocumentsByAudience(
  audience: string
): Promise<Response> {
  const href = `${checkinUrl(checkinPath.documents.khra)}?audience=${encodeURIComponent(audience)}`
  let res = await fetch(href, { headers: listAuthHeaders() })

  // Stale Bearer tokens return 401; `api()` refreshes elsewhere but this used raw fetch.
  if (res.status === 401 && typeof window !== "undefined") {
    if (await attemptTokenRefresh()) {
      res = await fetch(href, { headers: listAuthHeaders() })
    }
  }
  // List is intentionally readable without JWT; retry without a bad/expired header.
  if (res.status === 401) {
    res = await fetch(href, {})
  }

  return res
}

/** Timetable JSON from uploaded PDFs (`ProfessorTodayView`). */
export async function fetchProfessorScheduleToday(
  professor: string,
  query?: { day?: string }
): Promise<Response> {
  const href = checkinUrl(checkinPath.documents.scheduleToday(professor))
  const u = new URL(href)
  if (query?.day != null && query.day !== "") {
    u.searchParams.set("day", query.day)
  }
  return fetch(u.toString(), { headers: listAuthHeaders() })
}

export async function getDocumentById(
  id: string | number
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.documents.khraDetail(id)), {
    headers: listAuthHeaders(),
  })
}

export async function postDocument(formData: FormData): Promise<Response> {
  return fetch(checkinUrl(checkinPath.documents.khra), {
    method: "POST",
    headers: listAuthHeaders(),
    body: formData,
  })
}

export async function patchDocument(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.documents.khraDetail(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function putDocument(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.documents.khraDetail(id), {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export async function deleteDocument(
  id: string | number
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.documents.khraDetail(id)), {
    method: "DELETE",
    headers: listAuthHeaders(),
  })
}

// --- student absences + justifications (`justifications` Django app at `/api/`) ---

async function authorizedFetchBare(
  input: RequestInfo | URL,
  init: Omit<RequestInit, "headers"> & { headers?: HeadersInit }
): Promise<Response> {
  let headers: HeadersInit = {
    ...(init.headers as Record<string, string> | undefined),
    ...listAuthHeaders(),
  }
  let res = await fetch(input, { ...init, headers })
  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    (await attemptTokenRefresh())
  ) {
    headers = {
      ...(init.headers as Record<string, string> | undefined),
      ...listAuthHeaders(),
    }
    res = await fetch(input, { ...init, headers })
  }
  return res
}

/** Grouped absent counts by module (`StudentAbsenceViewSet.by_module`). */
export async function fetchStudentAbsencesByModule(): Promise<Response> {
  return authorizedFetchBare(checkinUrl(checkinPath.absences.byModule), {
    method: "GET",
  })
}

/** Per-slot absent attendance rows (`StudentAbsenceViewSet.by_date`). */
export async function fetchStudentAbsencesByDate(): Promise<Response> {
  return authorizedFetchBare(checkinUrl(checkinPath.absences.byDate), {
    method: "GET",
  })
}

export function loadAllJustificationsSchooling(): Promise<
  Record<string, unknown>[]
> {
  return loadDrfListAll(
    getApiBaseUrl(),
    `${checkinPath.justifications.collection}/`,
    listAuthHeaders(),
    {}
  )
}

/** Same endpoint as {@link loadAllJustificationsSchooling}; prefer this name for admin/schooling review UIs. */
export function loadAllJustificationsReviewQueue(): Promise<
  Record<string, unknown>[]
> {
  return loadAllJustificationsSchooling()
}

/** Student: `GET …/my_justifications/` returns a plain array — do not add `page_size` (avoids DRF list pagination quirks on this action). */
export async function loadStudentJustificationsList(): Promise<
  Record<string, unknown>[]
> {
  const href = checkinUrl(checkinPath.justifications.myJustifications)
  const res = await authorizedFetchBare(href, { method: "GET" })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(summarizeUpstreamError(text, res.status))
  }
  let raw: unknown = null
  try {
    raw = text ? JSON.parse(text) : null
  } catch {
    throw new Error("Invalid response from justifications endpoint")
  }
  return unwrapList<Record<string, unknown>>(raw)
}

/**
 * multipart/create — repeats `attendance_ids` keys for DRF `ListField` parsing.
 * @see `JustificationCreateSerializer` in Django.
 */
export async function postJustificationCreate(body: {
  attendance_ids: number[]
  absence_type: string
  cause: string
  file: File
}): Promise<Response> {
  const buildFd = () => {
    const fd = new FormData()
    for (const id of body.attendance_ids) {
      fd.append("attendance_ids", String(id))
    }
    fd.append("absence_type", body.absence_type)
    fd.append("cause", body.cause)
    fd.append("file", body.file)
    return fd
  }
  let res = await fetch(checkinUrl(checkinPath.justifications.collection), {
    method: "POST",
    headers: listAuthHeaders(),
    body: buildFd(),
  })
  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    (await attemptTokenRefresh())
  ) {
    res = await fetch(checkinUrl(checkinPath.justifications.collection), {
      method: "POST",
      headers: listAuthHeaders(),
      body: buildFd(),
    })
  }
  return res
}

export async function patchJustificationAccept(
  id: string | number
): Promise<Response> {
  return api(checkinPath.justifications.accept(id), {
    method: "PATCH",
    body: "{}",
  })
}

export async function patchJustificationRefuse(
  id: string | number
): Promise<Response> {
  return api(checkinPath.justifications.refuse(id), {
    method: "PATCH",
    body: "{}",
  })
}

export async function getJustificationById(
  id: string | number
): Promise<Response> {
  return api(checkinPath.justifications.detail(id), { method: "GET" })
}

// --- drf-spectacular (read-only) ---

export const openApi = {
  schemaUrl: () => checkinUrl(checkinPath.openApi.schema),
  docsUrl: () => checkinUrl(checkinPath.openApi.docs),
  redocUrl: () => checkinUrl(checkinPath.openApi.redoc),
}
