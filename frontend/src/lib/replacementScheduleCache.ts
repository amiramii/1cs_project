import { loadDrfListAll } from "@/lib/drfPaginatedList"
import { getApiBaseUrl } from "@/lib/apiBase"
import { checkinPath } from "@/lib/checkinApi"
import { listAuthHeaders } from "@/lib/checkinClient"
import { getScheduleFileFetchUrl } from "@/lib/scheduleMediaUrl"

export type ReplacementScheduleCacheRow = {
  id: string
  title: string
  year: string
  file: string
  uploaded_at: string
}

const STORAGE_KEY = "checkin.replacementSchedules.v1"

type ApiNotificationRow = {
  id: number
  type: string
  title: string
  message: string
  link: string
  created_at: string
}

function readRaw(): ReplacementScheduleCacheRow[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ReplacementScheduleCacheRow[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRaw(rows: ReplacementScheduleCacheRow[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

function extractYearLabel(title: string, message: string): string {
  const fromTitle = title.match(/-\s*(.+)$/)?.[1]?.trim()
  if (fromTitle) return fromTitle
  const fromMessage = message.match(/\(([^)]+)\)/)?.[1]?.trim()
  return fromMessage ?? "—"
}

function fileDedupeKey(file: string): string {
  return getScheduleFileFetchUrl(file).split("?")[0] ?? file
}

export function listReplacementScheduleCache(): ReplacementScheduleCacheRow[] {
  return readRaw().sort((a, b) =>
    String(b.uploaded_at).localeCompare(String(a.uploaded_at))
  )
}

export function appendReplacementScheduleCache(
  row: Omit<ReplacementScheduleCacheRow, "id" | "uploaded_at"> & {
    uploaded_at?: string
  }
): ReplacementScheduleCacheRow {
  const created: ReplacementScheduleCacheRow = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uploaded_at: row.uploaded_at ?? new Date().toISOString(),
    title: row.title,
    year: row.year,
    file: row.file,
  }
  writeRaw([created, ...readRaw()])
  return created
}

export function removeReplacementScheduleCache(id: string): void {
  writeRaw(readRaw().filter((row) => row.id !== id))
}

/** Notifications (students) + admin upload cache, deduped by file URL. */
export async function loadReplacementSchedulesMerged(): Promise<
  ReplacementScheduleCacheRow[]
> {
  const cached = listReplacementScheduleCache()
  let fromNotifications: ReplacementScheduleCacheRow[] = []

  try {
    const rows = await loadDrfListAll<ApiNotificationRow>(
      getApiBaseUrl(),
      `${checkinPath.notifications.collection}/`,
      listAuthHeaders(),
      {}
    )
    fromNotifications = rows
      .filter((row) => row.type === "exam_replacement" && row.link?.trim())
      .map((row) => ({
        id: `notif-${row.id}`,
        title: row.title,
        year: extractYearLabel(row.title, row.message),
        file: getScheduleFileFetchUrl(row.link),
        uploaded_at: row.created_at,
      }))
  } catch {
    fromNotifications = []
  }

  const byFile = new Map<string, ReplacementScheduleCacheRow>()
  for (const row of [...fromNotifications, ...cached]) {
    const key = fileDedupeKey(row.file)
    if (!byFile.has(key)) byFile.set(key, row)
  }

  return [...byFile.values()].sort((a, b) =>
    String(b.uploaded_at).localeCompare(String(a.uploaded_at))
  )
}
