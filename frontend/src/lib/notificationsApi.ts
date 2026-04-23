/**
 * Notifications API client (frontend-first).
 * Not part of `Checkin_backend` — there is no `/api/notifications/` route there
 * (see `lib/checkinApi.ts` for the routes that backend does expose).
 *
 * Future Django contract (suggested):
 * - GET  /api/notifications/?unread=1  → { results: NotificationDto[] }
 * - PATCH /api/notifications/:id/      → body { read: true }
 * - POST /api/notifications/mark-all-read/ → 204
 *
 * Until the backend exists, use mock data when fetch fails or when
 * NEXT_PUBLIC_USE_MOCK_NOTIFICATIONS=true.
 */

import { getApiBaseUrl } from "@/lib/apiBase"
import { getAccessToken } from "@/lib/tokenStorage"

export type NotificationDto = {
  id: string
  title: string
  body: string
  created_at: string
  read: boolean
}

function apiBase(): string {
  return getApiBaseUrl()
}

function useMock(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_NOTIFICATIONS === "true"
}

let mockStore: NotificationDto[] | null = null

function initialMock(): NotificationDto[] {
  const now = Date.now()
  return [
    {
      id: "mock-1",
      title: "New justification request",
      body: "A student submitted an absence justification.",
      created_at: new Date(now - 3600_000).toISOString(),
      read: false,
    },
    {
      id: "mock-2",
      title: "Session reminder",
      body: "You have a session scheduled today.",
      created_at: new Date(now - 7200_000).toISOString(),
      read: false,
    },
    {
      id: "mock-3",
      title: "Older notice",
      body: "This one was already read.",
      created_at: new Date(now - 86400_000).toISOString(),
      read: true,
    },
  ]
}

function getMockStore(): NotificationDto[] {
  if (!mockStore) mockStore = initialMock()
  return mockStore
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Set in `.env.local` to preview the notification loading skeleton (e.g. `2500` = 2.5s). */
function debugFetchDelayMs(): number {
  if (typeof process === "undefined") return 0
  const raw = process.env.NEXT_PUBLIC_NOTIFICATIONS_DEBUG_DELAY_MS
  if (!raw) return 0
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export async function fetchNotifications(): Promise<NotificationDto[]> {
  const debugDelay = debugFetchDelayMs()
  if (debugDelay > 0) {
    await delay(debugDelay)
  }

  if (useMock()) {
    await delay(120)
    return getMockStore().map((n) => ({ ...n }))
  }

  const token = getAccessToken()
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  try {
    const res = await fetch(`${apiBase()}/api/notifications/`, { headers })
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as
      | NotificationDto[]
      | { results?: NotificationDto[] }
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data.results)
        ? data.results
        : []
    return list
  } catch {
    await delay(80)
    return getMockStore().map((n) => ({ ...n }))
  }
}

/** Returns true when the server (or mock) accepted the read; false on failure. */
export async function markNotificationRead(id: string): Promise<boolean> {
  if (useMock()) {
    const store = getMockStore()
    const n = store.find((x) => x.id === id)
    if (n) n.read = true
    return true
  }

  const token = getAccessToken()
  try {
    const res = await fetch(`${apiBase()}/api/notifications/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ read: true }),
    })
    if (!res.ok) return false
    return true
  } catch {
    return false
  }
}

export async function markAllNotificationsRead(): Promise<boolean> {
  if (useMock()) {
    getMockStore().forEach((n) => {
      n.read = true
    })
    return true
  }

  const token = getAccessToken()
  try {
    const res = await fetch(`${apiBase()}/api/notifications/mark-all-read/`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!res.ok) return false
    return true
  } catch {
    return false
  }
}
