import type { AssignmentApi, SessionApi } from "@/lib/professorSessionData"
import type { ProfessorTimetableSession } from "@/lib/professorScheduleToday"

/** Parses Algerian timetable slots like `08h-09h30` → API time strings. */
export function parseFrenchTimeSlot(
  slot: string
): { start: string; end: string } | null {
  const dash = slot.indexOf("-")
  if (dash <= 0) return null
  const start = parseFrenchTimeToken(slot.slice(0, dash))
  const end = parseFrenchTimeToken(slot.slice(dash + 1))
  if (!start || !end) return null
  return { start, end }
}

function parseFrenchTimeToken(token: string): string | null {
  const t = token.trim().toLowerCase().replace(/\s/g, "")
  const m = t.match(/^(\d{1,2})h(\d{2})?$/)
  if (!m) return null
  const h = m[1].padStart(2, "0")
  const min = (m[2] ?? "00").padStart(2, "0")
  return `${h}:${min}:00`
}

export function normalizeApiTime(value: string): string {
  const parts = value.trim().split(":")
  if (parts.length < 2) return value.trim()
  const h = parts[0].padStart(2, "0")
  const m = parts[1].padStart(2, "0")
  const s = (parts[2] ?? "00").padStart(2, "0")
  return `${h}:${m}:${s}`
}

export function timetableSlotKey(slot: ProfessorTimetableSession): string {
  return `${slot.time_slot}|${slot.subject}|${slot.group}|${slot.room}`
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

/** Matches Excel `Subject` + `Group` to a teaching assignment for the logged-in teacher. */
export function resolveAssignmentForTimetableSlot(
  slot: ProfessorTimetableSession,
  assignments: AssignmentApi[]
): AssignmentApi | null {
  const subject = normalizeLabel(slot.subject)
  const group = normalizeLabel(slot.group)
  if (!subject || !group) return null

  const score = (a: AssignmentApi): number => {
    const mod = normalizeLabel(a.module_name ?? "")
    const grp = normalizeLabel(a.group_name ?? "")
    let s = 0
    if (mod === subject) s += 4
    else if (mod && (mod.includes(subject) || subject.includes(mod))) s += 2
    if (grp === group) s += 4
    else if (grp && (grp.includes(group) || group.includes(grp))) s += 2
    return s
  }

  let best: AssignmentApi | null = null
  let bestScore = 0
  for (const a of assignments) {
    const sc = score(a)
    if (sc > bestScore) {
      bestScore = sc
      best = a
    }
  }
  return bestScore >= 4 ? best : null
}

export function findTodaySessionForTimetableSlot(
  assignmentId: number,
  times: { start: string; end: string },
  todayIso: string,
  sessions: SessionApi[]
): SessionApi | null {
  const wantStart = normalizeApiTime(times.start)
  return (
    sessions.find(
      (s) =>
        s.date === todayIso &&
        s.assignment === assignmentId &&
        normalizeApiTime(String(s.start_time)) === wantStart
    ) ?? null
  )
}
