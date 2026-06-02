import {
  createSchooling,
  createStudent,
  createTeacher,
} from "@/lib/checkinClient"
import {
  clearAcademicCatalogCache,
  resolveStudentAcademicIds,
  resolveTeacherAcademicIds,
} from "@/lib/academicResolve"
import { formatDrfError, summarizeUpstreamError } from "@/lib/drfError"

async function assertCreateOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) return
  const text = await res.text()
  try {
    const body = JSON.parse(text) as unknown
    throw new Error(formatDrfError(body, summarizeUpstreamError(text, res.status)))
  } catch (error) {
    if (error instanceof Error && error.message !== fallback) throw error
    throw new Error(summarizeUpstreamError(text, res.status) || fallback)
  }
}

function autoNInscript(): string {
  return String(Date.now())
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

export async function createStudentManual(input: ManualStudentInput): Promise<void> {
  const academic = await resolveStudentAcademicIds(input)
  const res = await createStudent({
    full_name: input.full_name.trim(),
    email: input.email.trim(),
    n_inscript: input.n_inscript.trim(),
    year: academic.year,
    section: academic.section,
    group: academic.group,
  })
  await assertCreateOk(res, "Could not create student.")
  clearAcademicCatalogCache()
}

export async function createTeacherManual(input: ManualTeacherInput): Promise<void> {
  const academic = await resolveTeacherAcademicIds(input)
  const res = await createTeacher({
    full_name: input.full_name.trim(),
    email: input.email.trim(),
    n_inscript: (input.n_inscript?.trim() || autoNInscript()),
    year: academic.year,
    section: academic.section,
    module_name: input.module.trim(),
    semester: input.semester.trim(),
    groups: academic.groups,
  })
  await assertCreateOk(res, "Could not create professor.")
  clearAcademicCatalogCache()
}

export async function createSchoolingManual(input: ManualSchoolingInput): Promise<void> {
  const res = await createSchooling({
    full_name: input.full_name.trim(),
    email: input.email.trim(),
    department: input.department.trim(),
    n_inscript: (input.n_inscript?.trim() || autoNInscript()),
  })
  await assertCreateOk(res, "Could not create staff member.")
}
