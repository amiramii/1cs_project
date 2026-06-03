import {
  getStudentById,
  loadAllAcademicGroups,
  loadAllAcademicSections,
  loadAllAcademicYears,
  loadAllStudents,
  loadStudentExclusions,
  listAuthHeaders,
  patchSchooling,
  patchStudent,
  patchUser,
} from "@/lib/checkinClient"
import { formatDrfError } from "@/lib/drfError"
import { loadDrfListAll } from "@/lib/drfPaginatedList"
import { getApiBaseUrl } from "@/lib/apiBase"
import { checkinPath } from "@/lib/checkinApi"

let studentPkByUserIdCache: Map<string, number> | null = null

function normalizeToken(value: string): string {
  return value.trim().toUpperCase()
}

async function resolveUserIdByEmail(email: string): Promise<string | null> {
  const base = getApiBaseUrl()
  const users = await loadDrfListAll<{ id: string | number; email: string }>(
    base,
    `${checkinPath.users}/`,
    listAuthHeaders(),
    {}
  )
  const match = users.find(
    (user) => user.email.trim().toLowerCase() === email.trim().toLowerCase()
  )
  return match ? String(match.id) : null
}

export async function resolveStudentPkByUserId(
  userId: string
): Promise<number | null> {
  if (!studentPkByUserIdCache) {
    studentPkByUserIdCache = new Map()
    const [students, exclusions] = await Promise.all([
      loadAllStudents() as Promise<Array<{ user_id: string | number; email: string }>>,
      loadStudentExclusions().catch(() => []),
    ])
    const knownUserIds = new Set(students.map((row) => String(row.user_id)))
    const candidateIds = new Set<number>()
    for (const row of exclusions) {
      if (row.student != null) candidateIds.add(row.student)
    }
    const scanLimit = Math.max(students.length * 4, 120)
    for (let i = 1; i <= scanLimit; i += 1) {
      candidateIds.add(i)
    }
    await Promise.all(
      [...candidateIds].map(async (pk) => {
        const res = await getStudentById(pk)
        if (!res.ok) return
        const row = (await res.json()) as { user_id?: string | number }
        if (row.user_id == null) return
        const key = String(row.user_id)
        if (knownUserIds.has(key)) {
          studentPkByUserIdCache!.set(key, pk)
        }
      })
    )
  }
  return studentPkByUserIdCache.get(userId) ?? null
}

async function resolveStudentAcademicPks(input: {
  year: string
  section: string
  group: string
}): Promise<{ year: number; section: number; group: number }> {
  const [years, sections, groups] = await Promise.all([
    loadAllAcademicYears(),
    loadAllAcademicSections(),
    loadAllAcademicGroups(),
  ])
  const sectionRows = sections as Array<{ id: number; name: string; year: number }>
  const groupRows = groups as Array<{ id: number; name: string; section: number }>
  const yearToken = normalizeToken(input.year)
  const year =
    years.find((row) => normalizeToken(row.name) === yearToken) ??
    years.find((row) => String(row.id) === input.year.trim())
  if (!year) throw new Error("Year not found.")

  const sectionToken = normalizeToken(input.section)
  const section =
    sectionRows.find(
      (row) =>
        row.year === year.id &&
        (normalizeToken(row.name) === sectionToken ||
          String(row.id) === input.section.trim())
    ) ?? null
  if (!section) throw new Error("Section not found for this year.")

  const groupToken = normalizeToken(input.group)
  const group =
    groupRows.find(
      (row) =>
        row.section === section.id &&
        (normalizeToken(row.name) === groupToken ||
          String(row.id) === input.group.trim())
    ) ?? null
  if (!group) throw new Error("Group not found for this section.")

  return { year: year.id, section: section.id, group: group.id }
}

async function assertOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) return
  const text = await res.text()
  let data: Record<string, unknown> = {}
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {}
  } catch {
    throw new Error(text.trim() || fallback)
  }
  throw new Error(formatDrfError(data, text.trim() || fallback))
}

export type ManualStudentUpdateInput = {
  userId: string
  previousEmail: string
  email: string
  year: string
  section: string
  group: string
}

export async function updateStudentManual(
  input: ManualStudentUpdateInput
): Promise<void> {
  const studentPk = await resolveStudentPkByUserId(input.userId)
  if (studentPk == null) {
    throw new Error("Could not resolve this student record.")
  }

  const academic = await resolveStudentAcademicPks({
    year: input.year,
    section: input.section,
    group: input.group,
  })

  const studentRes = await patchStudent(studentPk, academic)
  await assertOk(studentRes, "Could not update student placement.")

  if (input.email.trim() && input.email.trim() !== input.previousEmail.trim()) {
    const userRes = await patchUser(input.userId, { email: input.email.trim() })
    await assertOk(userRes, "Could not update student email.")
  }
}

export async function updateProfessorEmailManual(input: {
  previousEmail: string
  email: string
}): Promise<void> {
  if (input.email.trim() === input.previousEmail.trim()) return
  const userId = await resolveUserIdByEmail(input.previousEmail)
  if (!userId) throw new Error("Could not resolve professor account.")
  const userRes = await patchUser(userId, { email: input.email.trim() })
  await assertOk(userRes, "Could not update professor email.")
}

export async function updateSchoolingManual(input: {
  schoolingId: string
  previousEmail: string
  email: string
  department: string
}): Promise<void> {
  const schoolingRes = await patchSchooling(input.schoolingId, {
    department: input.department,
  })
  await assertOk(schoolingRes, "Could not update staff department.")

  if (input.email.trim() && input.email.trim() !== input.previousEmail.trim()) {
    const userId = await resolveUserIdByEmail(input.previousEmail)
    if (!userId) throw new Error("Could not resolve staff account.")
    const userRes = await patchUser(userId, { email: input.email.trim() })
    await assertOk(userRes, "Could not update staff email.")
  }
}

export function clearStudentPkCache(): void {
  studentPkByUserIdCache = null
}
