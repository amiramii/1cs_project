/**
 * Legacy local-storage rows used when prototyping the student justification table.
 * Live data now comes from `GET /api/justifications/`; these helpers remain for migration from older builds.
 */

export type JustificationState = "pending" | "accepted" | "rejected"

export type StudentJustificationRow = {
  id: string
  /** Display date e.g. DD/MM/YYYY */
  justificationDate: string
  module: string
  state: JustificationState
  submittedAt: string
}

const STORAGE_KEY = "chekin.studentJustificationRows.v1"

/** Legacy batch records from earlier builds — migrated into rows on first read. */
const LEGACY_STORAGE_KEY = "chekin.studentJustificationOutbox.v1"

type LegacyRecord = {
  id: string
  submittedAt: string
  dateLabels: string[]
  dateKeys?: string[]
  absenceType?: string
  cause?: string
  fileName?: string | null
}

function readRawList(): StudentJustificationRow[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StudentJustificationRow[]
      if (Array.isArray(parsed)) return parsed
    }
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as LegacyRecord[]
      if (Array.isArray(legacy) && legacy.length > 0) {
        const migrated: StudentJustificationRow[] = []
        for (const r of legacy) {
          for (const label of r.dateLabels ?? []) {
            migrated.push({
              id: `${r.id}-m-${migrated.length}`,
              justificationDate: label,
              module: "—",
              state: "pending",
              submittedAt: r.submittedAt,
            })
          }
        }
        if (migrated.length > 0) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
          return migrated
        }
      }
    }
  } catch {
    /* ignore */
  }
  return []
}

function writeRawList(list: StudentJustificationRow[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 200)))
  } catch {
    /* ignore quota */
  }
}

/** Rows saved from the student’s submissions (newest first). */
export function getStudentJustificationRows(): StudentJustificationRow[] {
  return readRawList()
}

/**
 * Append one row per (date × module) from a justification submission.
 * All new rows start as `pending` until a future API updates them.
 */
export function appendJustificationRowsFromSubmission(
  items: { dateLabel: string; module: string }[]
): StudentJustificationRow[] {
  const submittedAt = new Date().toISOString()
  const created: StudentJustificationRow[] = items.map((item, i) => ({
    id: `jr-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    justificationDate: item.dateLabel,
    module: item.module,
    state: "pending",
    submittedAt,
  }))
  if (typeof window === "undefined") return created
  const list = readRawList()
  const next = [...created, ...list]
  writeRawList(next)
  return created
}

