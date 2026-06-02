import {
  loadAllAcademicGroups,
  loadAllAcademicSections,
  loadAllAcademicYears,
} from "@/lib/checkinClient"

type YearRow = { id: number; name: string }
type SectionRow = { id: number; name: string; year: number }
type GroupRow = { id: number; name: string; section: number; year?: number }

type AcademicCatalog = {
  years: YearRow[]
  sections: SectionRow[]
  groups: GroupRow[]
}

let catalogPromise: Promise<AcademicCatalog> | null = null

function norm(value: string): string {
  return value.trim().toLowerCase()
}

async function loadAcademicCatalog(): Promise<AcademicCatalog> {
  if (!catalogPromise) {
    catalogPromise = Promise.all([
      loadAllAcademicYears(),
      loadAllAcademicSections() as Promise<SectionRow[]>,
      loadAllAcademicGroups() as Promise<GroupRow[]>,
    ]).then(([years, sections, groups]) => ({ years, sections, groups }))
  }
  return catalogPromise
}

export function clearAcademicCatalogCache(): void {
  catalogPromise = null
}

function resolveYearId(years: YearRow[], raw: string): number {
  const trimmed = raw.trim()
  if (!trimmed) throw new Error("Year is required.")
  const asId = Number(trimmed)
  if (!Number.isNaN(asId) && years.some((y) => y.id === asId)) return asId
  const match = years.find((y) => norm(y.name) === norm(trimmed))
  if (!match) throw new Error(`Unknown year: ${raw}`)
  return match.id
}

function resolveSectionId(
  sections: SectionRow[],
  yearId: number,
  raw: string
): number {
  const trimmed = raw.trim()
  if (!trimmed) throw new Error("Section is required.")
  const scoped = sections.filter((s) => s.year === yearId)
  const asId = Number(trimmed)
  if (!Number.isNaN(asId) && scoped.some((s) => s.id === asId)) return asId
  const match = scoped.find((s) => norm(s.name) === norm(trimmed))
  if (!match) throw new Error(`Unknown section "${raw}" for the selected year.`)
  return match.id
}

function resolveGroupId(
  groups: GroupRow[],
  sectionId: number,
  raw: string
): number {
  const trimmed = raw.trim()
  if (!trimmed) throw new Error("Group is required.")
  const scoped = groups.filter((g) => g.section === sectionId)
  const asId = Number(trimmed)
  if (!Number.isNaN(asId) && scoped.some((g) => g.id === asId)) return asId
  const match = scoped.find((g) => norm(g.name) === norm(trimmed))
  if (!match) throw new Error(`Unknown group "${raw}" for the selected section.`)
  return match.id
}

function resolveGroupIds(
  groups: GroupRow[],
  sectionId: number,
  raw: string
): number[] {
  const parts = raw
    .split(/[;,]/)
    .map((g) => g.trim())
    .filter(Boolean)
  if (!parts.length) throw new Error("At least one group is required.")
  return parts.map((name) => resolveGroupId(groups, sectionId, name))
}

export async function resolveStudentAcademicIds(input: {
  year: string
  section: string
  group: string
}): Promise<{ year: number; section: number; group: number }> {
  const { years, sections, groups } = await loadAcademicCatalog()
  const yearId = resolveYearId(years, input.year)
  const sectionId = resolveSectionId(sections, yearId, input.section)
  const groupId = resolveGroupId(groups, sectionId, input.group)
  return { year: yearId, section: sectionId, group: groupId }
}

export async function resolveTeacherAcademicIds(input: {
  year: string
  section: string
  groups: string
}): Promise<{ year: number; section: number; groups: number[] }> {
  const { years, sections, groups } = await loadAcademicCatalog()
  const yearId = resolveYearId(years, input.year)
  const sectionId = resolveSectionId(sections, yearId, input.section)
  const groupIds = resolveGroupIds(groups, sectionId, input.groups)
  return { year: yearId, section: sectionId, groups: groupIds }
}
