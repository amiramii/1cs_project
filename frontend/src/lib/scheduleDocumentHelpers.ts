import { loadAllAcademicYears, postAcademicYear } from "@/lib/checkinClient"

export type AcademicYearRow = { id: number; name: string }

export type TeacherRow = { id: number; full_name: string }

/**
 * Maps `ScheduleYearCombobox` values to `AcademicYear.name` in the DB.
 * CSV import (`teachers.csv` / `students.csv`) often creates numeric names (`1`, `2`, `3`).
 */
const YEAR_KEY_ALIASES: Record<string, string[]> = {
  "1CP": ["1CP", "1"],
  "2CP": ["2CP", "2"],
  "1CS": ["1CS", "3"],
  "2CS": ["2CS", "4"],
  "3CS": ["3CS", "5", "5CS"],
  Doctorats: ["Doctorats", "Doctorat", "DOCTORATE", "دكتوراه"],
}

/** Name used when auto-creating a missing year on schedule upload. */
export const SCHEDULE_YEAR_CANONICAL_NAME: Record<string, string> = {
  "1CP": "1CP",
  "2CP": "2CP",
  "1CS": "1CS",
  "2CS": "2CS",
  "3CS": "3CS",
  Doctorats: "Doctorats",
}

function normalizeYearToken(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "")
}

/** Resolves combobox key (e.g. `1CP`, `Doctorats`) to an academic year primary key. */
export function resolveAcademicYearPk(
  yearKey: string,
  years: AcademicYearRow[]
): number | null {
  if (!yearKey || yearKey === "default" || yearKey === "All") return null
  const aliases = YEAR_KEY_ALIASES[yearKey] ?? [yearKey]
  const wanted = aliases.map(normalizeYearToken)
  for (const row of years) {
    const name = normalizeYearToken(row.name)
    if (wanted.some((w) => name === w || name.includes(w) || w.includes(name))) {
      return row.id
    }
  }
  return null
}

function formatKnownYears(years: AcademicYearRow[]): string {
  const names = years.map((y) => y.name.trim()).filter(Boolean)
  return names.length > 0 ? names.join(", ") : "(none)"
}

/**
 * Resolves a schedule year to a DB pk; creates `1CP`-style year if missing (admin upload).
 */
export async function resolveOrEnsureAcademicYearPk(
  yearKey: string,
  years: AcademicYearRow[]
): Promise<{ pk: number | null; years: AcademicYearRow[] }> {
  let pk = resolveAcademicYearPk(yearKey, years)
  if (pk != null) return { pk, years }

  const createName = SCHEDULE_YEAR_CANONICAL_NAME[yearKey] ?? yearKey
  try {
    const res = await postAcademicYear({ name: createName })
    if (res.ok) {
      const data = (await res.json()) as { id?: number; name?: string }
      if (typeof data.id === "number") {
        const row: AcademicYearRow = {
          id: data.id,
          name: String(data.name ?? createName),
        }
        return { pk: data.id, years: [...years, row] }
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
