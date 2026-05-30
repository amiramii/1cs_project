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

export function loadAllSchoolingStaff() {
  return loadDrfListAll(
    getApiBaseUrl(),
    `${checkinPath.schooling}/`,
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

export async function getSchoolingById(id: string | number): Promise<Response> {
  return api(checkinPath.schooler(id), { method: "GET" })
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

export async function createSchooling(body: unknown): Promise<Response> {
  return api(checkinPath.schooling, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export async function patchSchooling(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.schooler(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function putSchooling(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.schooler(id), {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export async function deleteSchoolingById(id: string | number): Promise<Response> {
  return api(checkinPath.schooler(id), { method: "DELETE" })
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

/** Paginated sessions scoped to one teaching assignment. */
export function loadSessionsByAssignment(assignmentId: number) {
  return loadDrfListAll<Record<string, unknown>>(
    getApiBaseUrl(),
    `${checkinPath.attendance.sessions}/?assignment=${assignmentId}`,
    listAuthHeaders(),
    {}
  )
}

// --- extra session requests (`extra_sessions` app at `/api/extra-sessions/`) ---

export type ExtraSessionRequestRow = {
  id: number
  teacher_name?: string
  teacher_email?: string
  module_name?: string
  group_name?: string
  date?: string
  start_time?: string
  end_time?: string
  status?: "pending" | "accepted" | "refused"
  reviewed_by_name?: string | null
  session_created?: boolean
  created_at?: string
}

function parseExtraSessionList(raw: unknown): ExtraSessionRequestRow[] {
  return unwrapList<ExtraSessionRequestRow>(raw)
}

async function authorizedFetchJsonList(
  href: string
): Promise<ExtraSessionRequestRow[]> {
  const res = await authorizedFetchBare(href, { method: "GET" })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(summarizeUpstreamError(text, res.status))
  }
  let raw: unknown = null
  try {
    raw = text ? JSON.parse(text) : null
  } catch {
    throw new Error("Invalid response from extra-sessions endpoint")
  }
  return parseExtraSessionList(raw)
}

export async function loadExtraSessionMyRequests(): Promise<
  ExtraSessionRequestRow[]
> {
  return authorizedFetchJsonList(checkinUrl(checkinPath.extraSessions.myRequests))
}

export async function loadExtraSessionUpcoming(): Promise<
  ExtraSessionRequestRow[]
> {
  return authorizedFetchJsonList(checkinUrl(checkinPath.extraSessions.upcoming))
}

export function loadExtraSessionSchoolingList() {
  return loadDrfListAll<ExtraSessionRequestRow>(
    getApiBaseUrl(),
    `${checkinPath.extraSessions.collection}/`,
    listAuthHeaders(),
    {}
  )
}

export async function postExtraSessionRequest(body: {
  teaching_assignment: number
  date: string
  start_time: string
  end_time: string
}): Promise<Response> {
  return fetch(checkinUrl(checkinPath.extraSessions.collection), {
    method: "POST",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(body),
  })
}

export async function patchExtraSessionAccept(
  id: string | number
): Promise<Response> {
  return api(checkinPath.extraSessions.accept(id), {
    method: "PATCH",
    body: "{}",
  })
}

export async function patchExtraSessionRefuse(
  id: string | number
): Promise<Response> {
  return api(checkinPath.extraSessions.refuse(id), {
    method: "PATCH",
    body: "{}",
  })
}

export async function postExtraSessionOpenSession(
  id: string | number
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.extraSessions.openSession(id)), {
    method: "POST",
    headers: jsonAuthHeaders(),
  })
}

export async function getExtraSessionById(id: string | number): Promise<Response> {
  return api(checkinPath.extraSessions.detail(id), { method: "GET" })
}

export async function deleteExtraSessionById(
  id: string | number
): Promise<Response> {
  return api(checkinPath.extraSessions.detail(id), { method: "DELETE" })
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
    `${checkinPath.documents.collection}/`,
    listAuthHeaders(),
    {}
  )
}

/** DRF list with `?audience=` (same as `ScheduleListShell` / student dashboard). */
export async function fetchDocumentsByAudience(
  audience: string
): Promise<Response> {
  const href = `${checkinUrl(checkinPath.documents.collection)}?audience=${encodeURIComponent(audience)}`
  const fallbackHref = checkinUrl(checkinPath.documents.collection)
  let res = await fetch(href, { headers: listAuthHeaders() })

  // Stale Bearer tokens return 401; `api()` refreshes elsewhere but this used raw fetch.
  if ((res.status === 401 || res.status === 403) && typeof window !== "undefined") {
    if (await attemptTokenRefresh()) {
      res = await fetch(href, { headers: listAuthHeaders() })
    }
  }
  // List is intentionally readable without JWT; retry without a bad/expired header.
  // Some backends respond 403 (not 401) for invalid Bearer tokens.
  if (res.status === 401 || res.status === 403) {
    res = await fetch(href, {})
  }

  // Some backend builds do not implement `?audience=` filtering and return 4xx.
  // Fallback to the plain list endpoint; caller can filter client-side.
  if (res.status === 400 || res.status === 404 || res.status === 422) {
    res = await fetch(fallbackHref, { headers: listAuthHeaders() })
    if (res.status === 401 || res.status === 403) {
      res = await fetch(fallbackHref, {})
    }
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
  return fetch(checkinUrl(checkinPath.documents.detail(id)), {
    headers: listAuthHeaders(),
  })
}

export async function postDocument(formData: FormData): Promise<Response> {
  return fetch(checkinUrl(checkinPath.documents.collection), {
    method: "POST",
    headers: listAuthHeaders(),
    body: formData,
  })
}

export async function patchDocument(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.documents.detail(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function putDocument(
  id: string | number,
  body: Record<string, unknown>
): Promise<Response> {
  return api(checkinPath.documents.detail(id), {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export async function deleteDocument(
  id: string | number
): Promise<Response> {
  return fetch(checkinUrl(checkinPath.documents.detail(id)), {
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

export async function fetchJustificationCount(): Promise<Response> {
  return authorizedFetchBare(checkinUrl(checkinPath.justifications.count), {
    method: "GET",
  })
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

export async function deleteJustificationById(
  id: string | number
): Promise<Response> {
  return api(checkinPath.justifications.detail(id), { method: "DELETE" })
}

// --- teacher absence (`teacher_absence` app at `/api/teacher-absence/`) ---

export type TeacherAbsenceRequestRow = {
  id: number
  teacher_name?: string
  reason?: string
  file?: string | null
  status?: string
  created_at?: string
  dates?: { date?: string }[]
}

function parseTeacherAbsenceList(raw: unknown): TeacherAbsenceRequestRow[] {
  return unwrapList<TeacherAbsenceRequestRow>(raw)
}

export async function loadTeacherAbsenceMyRequests(): Promise<
  TeacherAbsenceRequestRow[]
> {
  const href = checkinUrl(checkinPath.teacherAbsence.myRequests)
  const res = await authorizedFetchBare(href, { method: "GET" })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(summarizeUpstreamError(text, res.status))
  }
  let raw: unknown = null
  try {
    raw = text ? JSON.parse(text) : null
  } catch {
    throw new Error("Invalid response from teacher absence endpoint")
  }
  return parseTeacherAbsenceList(raw)
}

export function loadTeacherAbsenceSchoolingList() {
  return loadDrfListAll<TeacherAbsenceRequestRow>(
    getApiBaseUrl(),
    `${checkinPath.teacherAbsence.collection}/`,
    listAuthHeaders(),
    {}
  )
}

export async function postTeacherAbsenceCreate(body: {
  dates: string[]
  reason: string
  file?: File | null
}): Promise<Response> {
  const buildFd = () => {
    const fd = new FormData()
    for (const d of body.dates) {
      fd.append("dates", d)
    }
    fd.append("reason", body.reason)
    if (body.file) fd.append("file", body.file)
    return fd
  }
  let res = await fetch(checkinUrl(checkinPath.teacherAbsence.collection), {
    method: "POST",
    headers: listAuthHeaders(),
    body: buildFd(),
  })
  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    (await attemptTokenRefresh())
  ) {
    res = await fetch(checkinUrl(checkinPath.teacherAbsence.collection), {
      method: "POST",
      headers: listAuthHeaders(),
      body: buildFd(),
    })
  }
  return res
}

export async function patchTeacherAbsenceAccept(
  id: string | number
): Promise<Response> {
  return api(checkinPath.teacherAbsence.accept(id), {
    method: "PATCH",
    body: "{}",
  })
}

export async function patchTeacherAbsenceRefuse(
  id: string | number
): Promise<Response> {
  return api(checkinPath.teacherAbsence.refuse(id), {
    method: "PATCH",
    body: "{}",
  })
}

export async function getTeacherAbsenceById(
  id: string | number
): Promise<Response> {
  return api(checkinPath.teacherAbsence.detail(id), { method: "GET" })
}

export async function deleteTeacherAbsenceById(
  id: string | number
): Promise<Response> {
  return api(checkinPath.teacherAbsence.detail(id), { method: "DELETE" })
}

// --- drf-spectacular (read-only) ---

export const openApi = {
  schemaUrl: () => checkinUrl(checkinPath.openApi.schema),
  docsUrl: () => checkinUrl(checkinPath.openApi.docs),
  redocUrl: () => checkinUrl(checkinPath.openApi.redoc),
}
