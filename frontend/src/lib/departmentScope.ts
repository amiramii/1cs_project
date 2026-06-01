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
  const n = yearName.trim().toLowerCase().replace(/\s+/g, "")
  if (!n) return null

  // Numeric names from CSV import (aligned with scheduleDocumentHelpers)
  if (n === "1" || n === "1cp") return "CP"
  if (n === "2" || n === "2cp") return "CP"
  if (n === "3" || n === "1cs") return "CS"
  if (n === "4" || n === "2cs") return "CS"
  if (n === "5" || n === "5cs" || n === "3cs") return "CS"

  // Label variants
  if (/(^|[^a-z])cs([^a-z]|$)/i.test(n) || n.includes("cyclesuperieur") || n.includes("cyclesupérieur")) {
    return "CS"
  }
  if (/(^|[^a-z])cp([^a-z]|$)/i.test(n) || n.includes("cyclepreparatoire") || n.includes("cyclepréparatoire")) {
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
