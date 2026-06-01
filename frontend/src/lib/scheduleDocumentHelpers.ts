import { checkinPath } from "@/lib/checkinApi"
import { getApiBaseUrl } from "@/lib/apiBase"
import {
  loadAllAcademicYears,
  postAcademicYear,
} from "@/lib/checkinClient"
import { loadDrfListAll } from "@/lib/drfPaginatedList"
import { getAccessToken, getStoredUserEmail } from "@/lib/tokenStorage"

export type AcademicYearRow = { id: number; name: string }

export type TeacherRow = { id: number; full_name: string }

/**
 * Maps `ScheduleYearCombobox` values to `AcademicYear.name` in the DB.
 * CSV import often creates numeric names (`1`, `2`, `3`).
 */
const YEAR_KEY_ALIASES: Record<string, string[]> = {
  "1CP": ["1CP", "1"],
  "2CP": ["2CP", "2"],
  "1CS": ["1CS", "3"],
  "2CS": ["2CS", "4"],
  "3CS": ["3CS", "5", "5CS"],
  Doctorats: ["Doctorats", "Doctorat", "DOCTORATE", "دكتوراه"],
}

/**
 * Name to create when no row exists yet — matches typical CSV `year` column.
 * Keeps schedule `year` FK aligned with `Student.year` from imports.
 */
export const PREFERRED_DB_YEAR_NAME: Record<StudyGradeKey, string> = {
  "1CP": "1",
  "2CP": "2",
  "1CS": "3",
  "2CS": "4",
  "3CS": "5",
  Doctorats: "Doctorats",
}

/** @deprecated Use PREFERRED_DB_YEAR_NAME for new rows; kept for display labels. */
export const SCHEDULE_YEAR_CANONICAL_NAME: Record<string, string> = {
  "1CP": "1CP",
  "2CP": "2CP",
  "1CS": "1CS",
  "2CS": "2CS",
  "3CS": "3CS",
  Doctorats: "Doctorats",
}

export type StudyGradeKey =
  | "1CP"
  | "2CP"
  | "1CS"
  | "2CS"
  | "3CS"
  | "Doctorats"

function normalizeYearToken(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "")
}

/** Maps a DB year name to a combobox grade key (strict; no substring traps). */
export function yearNameToGradeKey(
  raw: string | null | undefined
): StudyGradeKey | null {
  if (!raw?.trim()) return null
  const n = normalizeYearToken(raw)
  if (n === "1" || n === "1CP") return "1CP"
  if (n === "2" || n === "2CP") return "2CP"
  if (n === "3" || n === "1CS") return "1CS"
  if (n === "4" || n === "2CS") return "2CS"
  if (n === "5" || n === "5CS" || n === "3CS") return "3CS"
  if (n.includes("DOCTOR") || n === "دكتوراه") {
    return "Doctorats"
  }
  return null
}

function isComboboxYearKey(yearKey: string): yearKey is StudyGradeKey {
  return yearKey in YEAR_KEY_ALIASES
}

function collectMatchingYearIds(
  targetGrade: StudyGradeKey,
  years: AcademicYearRow[]
): number[] {
  const ids: number[] = []
  const seen = new Set<number>()

  for (const row of years) {
    if (yearNameToGradeKey(row.name) !== targetGrade) continue
    if (seen.has(row.id)) continue
    seen.add(row.id)
    ids.push(row.id)
  }

  const aliases = YEAR_KEY_ALIASES[targetGrade].map(normalizeYearToken)
  for (const row of years) {
    const name = normalizeYearToken(row.name)
    if (!aliases.includes(name)) continue
    if (seen.has(row.id)) continue
    seen.add(row.id)
    ids.push(row.id)
  }

  return ids
}

/** When several DB rows map to the same grade, prefer the CSV-style numeric name. */
function pickPreferredYearId(
  targetGrade: StudyGradeKey,
  years: AcademicYearRow[]
): number | null {
  const matchIds = collectMatchingYearIds(targetGrade, years)
  if (matchIds.length === 0) return null
  if (matchIds.length === 1) return matchIds[0]!

  const preferredToken = normalizeYearToken(
    PREFERRED_DB_YEAR_NAME[targetGrade]
  )
  for (const row of years) {
    if (!matchIds.includes(row.id)) continue
    if (normalizeYearToken(row.name) === preferredToken) return row.id
  }

  // Oldest row (lowest id) is usually from the first CSV import.
  return Math.min(...matchIds)
}

/**
 * Resolves combobox key (e.g. `1CS`) to an academic year primary key.
 * Matches numeric CSV names (`3`) and labels (`1CS`) without false positives.
 */
export function resolveAcademicYearPk(
  yearKey: string,
  years: AcademicYearRow[]
): number | null {
  if (!yearKey || yearKey === "default" || yearKey === "All") return null

  const targetGrade = isComboboxYearKey(yearKey)
    ? yearKey
    : yearNameToGradeKey(yearKey)

  if (targetGrade) {
    return pickPreferredYearId(targetGrade, years)
  }

  const wanted = normalizeYearToken(yearKey)
  for (const row of years) {
    if (normalizeYearToken(row.name) === wanted) return row.id
  }
  return null
}

function formatKnownYears(years: AcademicYearRow[]): string {
  const names = years.map((y) => y.name.trim()).filter(Boolean)
  return names.length > 0 ? names.join(", ") : "(none)"
}

/**
 * Resolves a schedule year to a DB pk; creates preferred CSV-style year only if missing.
 */
export async function resolveOrEnsureAcademicYearPk(
  yearKey: string,
  years: AcademicYearRow[]
): Promise<{ pk: number | null; years: AcademicYearRow[] }> {
  let pk = resolveAcademicYearPk(yearKey, years)
  if (pk != null) return { pk, years }

  const grade = isComboboxYearKey(yearKey) ? yearKey : yearNameToGradeKey(yearKey)
  const createName =
    (grade && PREFERRED_DB_YEAR_NAME[grade]) ??
    SCHEDULE_YEAR_CANONICAL_NAME[yearKey] ??
    yearKey

  try {
    const res = await postAcademicYear({ name: createName })
    if (res.ok) {
      const data = (await res.json()) as { id?: number; name?: string }
      if (typeof data.id === "number") {
        const row: AcademicYearRow = {
          id: data.id,
          name: String(data.name ?? createName),
        }
        pk = resolveAcademicYearPk(yearKey, [...years, row])
        return { pk: pk ?? data.id, years: [...years, row] }
      }
    }
  } catch {
    /* try refresh below */
  }

  const fresh = await loadAllAcademicYears().catch(() => years)
  pk = resolveAcademicYearPk(yearKey, fresh)
  return { pk, years: fresh }
}

export function academicYearResolveHint(
  yearKey: string,
  years: AcademicYearRow[],
  isArabic: boolean
): string {
  const known = formatKnownYears(years)
  if (isArabic) {
    return `السنة «${yearKey}» غير موجودة. السنوات في القاعدة: ${known}. استورد الطلاب/الأساتذة (عمود year) أو أنشئ السنة من الإعداد الأكاديمي.`
  }
  return `Year «${yearKey}» was not found. Years in the database: ${known}. Import students/teachers (year column) or create the year under academic settings.`
}

/** Logged-in student's `AcademicYear` id (matches backend document filter). */
export async function resolveLoggedInStudentAcademicYearId(): Promise<
  number | null
> {
  const email = getStoredUserEmail()?.trim().toLowerCase()
  if (!email) return null
  const token = getAccessToken()
  if (!token) return null

  const headers: HeadersInit = { Authorization: `Bearer ${token}` }
  const base = getApiBaseUrl()
  try {
    const students = await loadDrfListAll<{
      email?: string
      year?: number
    }>(base, `${checkinPath.students}/`, headers, {})
    const me = students.find(
      (s) => s.email?.trim().toLowerCase() === email
    )
    return typeof me?.year === "number" ? me.year : null
  } catch {
    return null
  }
}

/** Matches professor display name to a `Teacher` row for document uploads. */
export function resolveTeacherPk(
  professorName: string,
  teachers: TeacherRow[]
): number | null {
  const q = professorName.trim().toLowerCase()
  if (!q) return null
  const exact = teachers.find(
    (t) => t.full_name.trim().toLowerCase() === q
  )
  if (exact) return exact.id
  const partial = teachers.find((t) =>
    t.full_name.trim().toLowerCase().includes(q)
  )
  return partial?.id ?? null
}
