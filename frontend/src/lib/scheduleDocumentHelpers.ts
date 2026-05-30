export type AcademicYearRow = { id: number; name: string }

export type TeacherRow = { id: number; full_name: string }

/** Maps `ScheduleYearCombobox` values to possible `AcademicYear.name` values in the DB. */
const YEAR_KEY_ALIASES: Record<string, string[]> = {
  "1CP": ["1CP"],
  "2CP": ["2CP"],
  "1CS": ["1CS"],
  "2CS": ["2CS"],
  "3CS": ["3CS", "5CS"],
  Doctorats: ["Doctorats", "Doctorat", "DOCTORATE", "دكتوراه"],
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
