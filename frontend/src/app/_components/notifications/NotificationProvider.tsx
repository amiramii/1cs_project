"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationDto,
} from "@/lib/notificationsApi"

type NotificationContextValue = {
  items: NotificationDto[]
  unreadCount: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null
)

/** Background refresh — poll server notifications while dashboard is open. */
const POLL_MS = 60_000

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

/**
 * Ensures the first load shows loading UI long enough to notice (esp. skeleton in the menu).
 * Set `NEXT_PUBLIC_NOTIFICATIONS_MIN_LOADING_MS=0` in `.env.local` to disable.
 */
function minFirstLoadMs(): number {
  const raw = process.env.NEXT_PUBLIC_NOTIFICATIONS_MIN_LOADING_MS
  if (raw !== undefined && raw !== "") {
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }
  if (process.env.NODE_ENV === "development") return 450
  return 0
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [items, setItems] = useState<NotificationDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const firstLoadRef = useRef(true)

  const refresh = useCallback(async () => {
    const isFirstLoad = firstLoadRef.current
    try {
      setError(null)
      const listPromise = fetchNotifications()
      const minPromise = isFirstLoad ? delay(minFirstLoadMs()) : Promise.resolve()
      const [list] = await Promise.all([listPromise, minPromise])
      setItems(list)
    } catch (e) {
      console.error("fetchNotifications", e)
      setError("Failed to load notifications")
    } finally {
      setLoading(false)
      firstLoadRef.current = false
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onRefresh = () => {
      void refresh()
    }
    window.addEventListener("chekin-notifications-refresh", onRefresh)
    return () => window.removeEventListener("chekin-notifications-refresh", onRefresh)
  }, [refresh])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return
      }
      void refresh()
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [refresh])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [refresh])

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  )

  const markAsRead = useCallback(async (id: string) => {
    let snapshot: NotificationDto[] = []
    setItems((prev) => {
      snapshot = prev.map((n) => ({ ...n }))
      return prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    })
    const ok = await markNotificationRead(id)
    if (!ok) setItems(snapshot)
  }, [])

  const markAllRead = useCallback(async () => {
    let snapshot: NotificationDto[] = []
    setItems((prev) => {
      snapshot = prev.map((n) => ({ ...n }))
      return prev.map((n) => ({ ...n, read: true }))
    })
    const ok = await markAllNotificationsRead()
    if (!ok) setItems(snapshot)
  }, [])

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      error,
      refresh,
      markAsRead,
      markAllRead,
    }),
    [items, unreadCount, loading, error, refresh, markAsRead, markAllRead]
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return ctx
}
