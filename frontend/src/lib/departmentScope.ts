import { loadAllSchoolingStaff } from "@/lib/checkinClient"
import { getStoredUserEmail } from "@/lib/tokenStorage"

export type SchoolingDepartment = "CS" | "CP"

export type AcademicYearRow = {
  id: number
  name?: string
}

export type AcademicModuleRow = {
  id?: number
  name?: string
  year?: number
}

export function normalizeDepartmentCode(raw: unknown): SchoolingDepartment | null {
  if (typeof raw !== "string") return null
  const code = raw.trim().toUpperCase()
  if (code === "CS" || code === "CP") return code
  return null
}

export function inferDepartmentFromYearName(
  yearName: string | null | undefined
): SchoolingDepartment | null {
  if (typeof yearName !== "string") return null
  const n = yearName.trim().toLowerCase()
  if (!n) return null

  // Accept common variants like "1CS", "1 cs", "cycle supérieur", etc.
  if (/(^|[^a-z])cs([^a-z]|$)/i.test(n) || n.includes("cycle superieur") || n.includes("cycle supérieur")) {
    return "CS"
  }
  if (/(^|[^a-z])cp([^a-z]|$)/i.test(n) || n.includes("cycle preparatoire") || n.includes("cycle préparatoire")) {
    return "CP"
  }
  return null
}

export function buildYearNameByIdMap(
  years: AcademicYearRow[]
): Map<number, string> {
  const map = new Map<number, string>()
  for (const y of years) {
    if (typeof y.id !== "number") continue
    if (typeof y.name !== "string") continue
    map.set(y.id, y.name)
  }
  return map
}

export function inferDepartmentFromModuleName(
  moduleName: string | null | undefined,
  modules: AcademicModuleRow[],
  yearNameById: Map<number, string>
): SchoolingDepartment | null {
  if (typeof moduleName !== "string" || !moduleName.trim()) return null
  const found = modules.find(
    (m) =>
      typeof m.name === "string" &&
      m.name.trim().toLowerCase() === moduleName.trim().toLowerCase()
  )
  if (!found || typeof found.year !== "number") return null
  const yearName = yearNameById.get(found.year)
  return inferDepartmentFromYearName(yearName)
}

export async function loadCurrentSchoolingDepartment(): Promise<SchoolingDepartment | null> {
  const currentEmail = getStoredUserEmail()?.trim().toLowerCase()
  if (!currentEmail) return null
  const staff = await loadAllSchoolingStaff()
  const me = staff.find((row) => {
    if (!row || typeof row !== "object") return false
    const email =
      typeof (row as { email?: unknown }).email === "string"
        ? ((row as { email?: string }).email ?? "").trim().toLowerCase()
        : ""
    return email !== "" && email === currentEmail
  }) as { department?: unknown } | undefined

  return normalizeDepartmentCode(me?.department)
}
