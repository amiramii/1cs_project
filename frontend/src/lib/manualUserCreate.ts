import { uploadCheckinCsv } from "@/lib/checkinClient"
import { formatDrfError, summarizeUpstreamError } from "@/lib/drfError"

function csvEscape(value: unknown): string {
  const s = String(value ?? "")
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function autoNInscript(): string {
  return String(Date.now())
}

async function uploadSingleCsvRow(
  userType: "student" | "teacher" | "schooling",
  headers: string[],
  row: Record<string, unknown>
): Promise<Response> {
  const csv = [
    headers.join(","),
    headers.map((key) => csvEscape(row[key])).join(","),
  ].join("\n")
  const file = new File([csv], `${userType}-manual.csv`, { type: "text/csv" })
  return uploadCheckinCsv(file, userType)
}

async function assertCsvUploadOk(res: Response, fallback: string): Promise<void> {
  const text = await res.text()
  let data: Record<string, unknown> = {}
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {}
  } catch {
    throw new Error(summarizeUpstreamError(text, res.status) || fallback)
  }

  if (!res.ok) {
    throw new Error(formatDrfError(data, summarizeUpstreamError(text, res.status)))
  }

  const created = typeof data.users_created === "number" ? data.users_created : 0
  const errors = Array.isArray(data.errors) ? data.errors : []

  if (created > 0) return

  if (errors.length > 0) {
    const first = errors[0] as { error?: unknown }
    if (typeof first?.error === "string" && first.error.trim()) {
      throw new Error(first.error)
    }
  }

  throw new Error(fallback)
}

export type ManualStudentInput = {
  full_name: string
  email: string
  n_inscript: string
  year: string
  section: string
  group: string
}

export type ManualTeacherInput = {
  full_name: string
  email: string
  n_inscript?: string
  module: string
  groups: string
  semester: string
  section: string
  year: string
}

export type ManualSchoolingInput = {
  full_name: string
  email: string
  department: string
  n_inscript?: string
}

/** Uses `api/upload/` — same path as bulk CSV; resolves year/section/group/module by name. */
export async function createStudentManual(input: ManualStudentInput): Promise<void> {
  const res = await uploadSingleCsvRow(
    "student",
    ["full_name", "email", "n_inscript", "year", "section", "group"],
    {
      full_name: input.full_name.trim(),
      email: input.email.trim(),
      n_inscript: input.n_inscript.trim(),
      year: input.year.trim(),
      section: input.section.trim(),
      group: input.group.trim(),
    }
  )
  await assertCsvUploadOk(res, "Could not create student.")
}

export async function createTeacherManual(input: ManualTeacherInput): Promise<void> {
  const res = await uploadSingleCsvRow(
    "teacher",
    ["full_name", "email", "n_inscript", "module", "groups", "semester", "section", "year"],
    {
      full_name: input.full_name.trim(),
      email: input.email.trim(),
      n_inscript: input.n_inscript?.trim() || autoNInscript(),
      module: input.module.trim(),
      groups: input.groups.trim(),
      semester: input.semester.trim(),
      section: input.section.trim(),
      year: input.year.trim(),
    }
  )
  await assertCsvUploadOk(res, "Could not create professor.")
}

export async function createSchoolingManual(input: ManualSchoolingInput): Promise<void> {
  const res = await uploadSingleCsvRow(
    "schooling",
    ["full_name", "email", "department", "n_inscript"],
    {
      full_name: input.full_name.trim(),
      email: input.email.trim(),
      department: input.department.trim(),
      n_inscript: input.n_inscript?.trim() || autoNInscript(),
    }
  )
  await assertCsvUploadOk(res, "Could not create staff member.")
}
