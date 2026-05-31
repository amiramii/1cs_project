import { checkinPath } from "@/lib/checkinApi"
import { getApiBaseUrl } from "@/lib/apiBase"
import {
  fetchProfessorScheduleToday,
  type ExcelScheduleSemester,
} from "@/lib/checkinClient"
import { loadDrfListAll } from "@/lib/drfPaginatedList"
import {
  getAccessToken,
  getCurrentUserDisplayName,
  getStoredUserEmail,
} from "@/lib/tokenStorage"

export type { ExcelScheduleSemester }

export type ProfessorTimetableSession = {
  time_slot: string
  session_type: string
  subject: string
  group: string
  room: string
}

export type ProfessorTimetableToday = {
  professor: string
  day: string | null
  has_class: boolean
  is_weekend?: boolean
  message?: string
  sessions: ProfessorTimetableSession[]
}

function parseSessions(raw: unknown): ProfessorTimetableSession[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((row) => row && typeof row === "object")
    .map((row) => {
      const o = row as Record<string, unknown>
      return {
        time_slot: String(o.time_slot ?? ""),
        session_type: String(o.session_type ?? ""),
        subject: String(o.subject ?? ""),
        group: String(o.group ?? ""),
        room: String(o.room ?? ""),
      }
    })
}

export function parseProfessorTimetableToday(raw: unknown): ProfessorTimetableToday | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const sessions = parseSessions(o.sessions)
  const hasClass =
    typeof o.has_class === "boolean"
      ? o.has_class
      : sessions.length > 0
  return {
    professor: String(o.professor ?? ""),
    day: o.day == null ? null : String(o.day),
    has_class: hasClass,
    is_weekend: o.is_weekend === true,
    message: typeof o.message === "string" ? o.message : undefined,
    sessions,
  }
}

/** Resolves the professor label used in uploaded Excel timetables (`Professor` column). */
export async function resolveProfessorTimetableName(): Promise<string | null> {
  const email = getStoredUserEmail()?.trim().toLowerCase()
  const token = getAccessToken()
  if (email && token) {
    try {
      const rows = await loadDrfListAll<{
        full_name?: string
        email?: string
      }>(
        getApiBaseUrl(),
        `${checkinPath.teachers}/`,
        { Authorization: `Bearer ${token}` },
        {}
      )
      const match = rows.find(
        (row) => row.email?.trim().toLowerCase() === email
      )
      const fromTeacher = match?.full_name?.trim()
      if (fromTeacher) return fromTeacher
    } catch {
      /* fall through to JWT display name */
    }
  }
  return getCurrentUserDisplayName()?.trim() || null
}

/** Loads today's timetable for a professor name as stored in the Excel `Professor_View` sheet. */
export async function loadProfessorTimetableToday(
  professor: string,
  query?: { day?: string }
): Promise<ProfessorTimetableToday | null> {
  const name = professor.trim()
  if (!name) return null
  const res = await fetchProfessorScheduleToday(name, query)
  const text = await res.text()
  if (!res.ok) {
    const trimmed = text.trim()
    if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
      throw new Error(
        "Server could not read the Excel timetable (missing openpyxl on the API). Ask an admin to run: pip install openpyxl"
      )
    }
    let detail = trimmed
    try {
      const parsed = JSON.parse(trimmed) as { detail?: string }
      if (typeof parsed.detail === "string" && parsed.detail.trim()) {
        detail = parsed.detail
      }
    } catch {
      /* use raw text */
    }
    throw new Error(detail || `Failed to load timetable (HTTP ${res.status})`)
  }
  if (!text.trim()) return null
  try {
    return parseProfessorTimetableToday(JSON.parse(text) as unknown)
  } catch {
    return null
  }
}
