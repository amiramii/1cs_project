import { checkinPath } from "@/lib/checkinApi"
import { getApiBaseUrl } from "@/lib/apiBase"
import {
  loadAllAcademicYears,
  loadAllExcelSchedules,
  type ExcelScheduleRow,
} from "@/lib/checkinClient"
import { loadDrfListAll } from "@/lib/drfPaginatedList"
import { getScheduleFileFetchUrl } from "@/lib/scheduleMediaUrl"
import { getAccessToken, getStoredUserEmail } from "@/lib/tokenStorage"

export type TimetableSlotRow = {
  day: string
  time_slot: string
  subject: string
  professor: string
  group: string
  room: string
  session_type: string
}

export type GradeFilter =
  | "all"
  | "1CP"
  | "2CP"
  | "1CS"
  | "2CS"
  | "3CS"
  | "DOCTORATE"

const DAY_ORDER: Record<string, number> = {
  Dimanche: 0,
  Lundi: 1,
  Mardi: 2,
  Mercredi: 3,
  Jeudi: 4,
}

const SLOT_ORDER: Record<string, number> = {
  "08h-09h30": 0,
  "09h30-11h": 1,
  "11h-12h30": 2,
  "14h-15h30": 3,
  "14h-16h00": 4,
}

function normalizeYearToFilter(
  raw: string | null | undefined
): Exclude<GradeFilter, "all"> | null {
  if (!raw?.trim()) return null
  const n = raw.toUpperCase().replace(/\s+/g, "")
  if (n === "1" || n.includes("1CP")) return "1CP"
  if (n === "2" || n.includes("2CP")) return "2CP"
  if (n.includes("3CS") || n.includes("5CS") || n === "5") return "3CS"
  if (n.includes("2CS") || n === "4") return "2CS"
  if (n.includes("1CS") || n === "3") return "1CS"
  if (n.includes("DOCTOR")) return "DOCTORATE"
  return null
}

export function normalizeGroupToken(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "")
}

function resolveExcelYearFilter(
  item: ExcelScheduleRow,
  yearMap: Map<number, string>
): Exclude<GradeFilter, "all"> | null {
  const y = item.year
  if (y != null) {
    if (typeof y === "object" && "name" in y) {
      return normalizeYearToFilter(y.name)
    }
    if (typeof y === "number") {
      return normalizeYearToFilter(yearMap.get(y))
    }
  }
  return normalizeYearToFilter(item.title)
}

export function pickLatestExcelForGrade(
  items: ExcelScheduleRow[],
  yearMap: Map<number, string>,
  gradeFilter: GradeFilter,
  semester?: "S1" | "S2"
): ExcelScheduleRow | null {
  let filtered =
    gradeFilter === "all"
      ? items
      : items.filter((row) => resolveExcelYearFilter(row, yearMap) === gradeFilter)
  if (semester) {
    filtered = filtered.filter((row) => row.semester === semester)
  }
  if (filtered.length === 0) return null
  return [...filtered].sort(
    (a, b) =>
      new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  )[0]!
}

export async function parseProfessorViewXlsx(
  buffer: ArrayBuffer
): Promise<TimetableSlotRow[]> {
  const XLSX = await import("xlsx")
  const wb = XLSX.read(buffer, { type: "array" })
  const sheetName =
    wb.SheetNames.find((n) =>
      /professor_view|student_view|emploi|timetable/i.test(n)
    ) ??
    wb.SheetNames.find((n) => n.toLowerCase().includes("view")) ??
    wb.SheetNames[0]
  if (!sheetName) return []
  const sheet = wb.Sheets[sheetName]
  if (!sheet) return []
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  })
  const parsed: TimetableSlotRow[] = []
  for (const row of rows) {
    const keys = Object.keys(row).reduce(
      (acc, k) => {
        acc[k.trim()] = k
        return acc
      },
      {} as Record<string, string>
    )
    const get = (name: string) => {
      const key = keys[name]
      return key ? String(row[key] ?? "").trim() : ""
    }
    const day = get("Day")
    const time_slot = get("Time_Slot")
    const subject = get("Subject") || get("Module")
    const session_type = get("Session_Type") || get("Type")
    if (!day && !time_slot && !subject) continue
    parsed.push({
      day,
      time_slot,
      subject,
      professor: get("Professor"),
      group: get("Group"),
      room: get("Room"),
      session_type,
    })
  }
  return sortTimetableSlots(parsed)
}

export function sortTimetableSlots(rows: TimetableSlotRow[]): TimetableSlotRow[] {
  return [...rows].sort((a, b) => {
    const dayA = DAY_ORDER[a.day] ?? 99
    const dayB = DAY_ORDER[b.day] ?? 99
    if (dayA !== dayB) return dayA - dayB
    const slotA = SLOT_ORDER[a.time_slot.trim()] ?? 99
    const slotB = SLOT_ORDER[b.time_slot.trim()] ?? 99
    return slotA - slotB
  })
}

export function filterSlotsForStudentGroup(
  rows: TimetableSlotRow[],
  groupName: string | null
): TimetableSlotRow[] {
  if (!groupName?.trim()) return rows
  const want = normalizeGroupToken(groupName)
  return rows.filter((r) => normalizeGroupToken(r.group) === want)
}

export async function loadWeeklyTimetableSlots(options: {
  gradeFilter: GradeFilter
  groupName?: string | null
  semester?: "S1" | "S2"
}): Promise<{ slots: TimetableSlotRow[]; sourceTitle: string | null }> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
  }
  const [excelRows, years] = await Promise.all([
    loadAllExcelSchedules(),
    loadAllAcademicYears().catch(() => [] as Array<{ id: number; name: string }>),
  ])
  const yearMap = new Map(years.map((y) => [y.id, y.name]))
  const latest = pickLatestExcelForGrade(
    excelRows,
    yearMap,
    options.gradeFilter,
    options.semester
  )
  if (!latest?.file) {
    return { slots: [], sourceTitle: null }
  }
  const url = getScheduleFileFetchUrl(latest.file)
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`Failed to load timetable file (HTTP ${res.status})`)
  }
  const buffer = await res.arrayBuffer()
  let slots = await parseProfessorViewXlsx(buffer)
  if (options.groupName) {
    slots = filterSlotsForStudentGroup(slots, options.groupName)
  }
  return { slots, sourceTitle: latest.title?.trim() || null }
}

/** Resolves the logged-in student's academic group label (e.g. G1) for timetable filtering. */
export async function resolveStudentGroupName(): Promise<string | null> {
  const email = getStoredUserEmail()?.trim().toLowerCase()
  if (!email) return null
  const token = getAccessToken()
  if (!token) return null
  const headers: HeadersInit = { Authorization: `Bearer ${token}` }
  const base = getApiBaseUrl()
  try {
    const [students, groups] = await Promise.all([
      loadDrfListAll<{
        email?: string
        group?: number
      }>(base, `${checkinPath.students}/`, headers, {}),
      loadDrfListAll<{ id: number; name: string }>(
        base,
        `${checkinPath.academic.groups}/`,
        headers,
        {}
      ),
    ])
    const me = students.find(
      (s) => s.email?.trim().toLowerCase() === email
    )
    if (!me || typeof me.group !== "number") return null
    return groups.find((g) => g.id === me.group)?.name?.trim() ?? null
  } catch {
    return null
  }
}
