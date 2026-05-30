"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, Loader2 } from "lucide-react"

import { useLanguage } from "@/app/_components/language-provider"
import { useNotifications } from "@/app/_components/notifications/NotificationProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import type { NotificationDto } from "@/lib/notificationsApi"

function formatRelative(iso: string, isAr: boolean): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 45) return isAr ? "الآن" : "Just now"
  const min = Math.floor(sec / 60)
  if (min < 60) return isAr ? `منذ ${min} د` : `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 48) return isAr ? `منذ ${h} س` : `${h}h ago`
  return d.toLocaleDateString(isAr ? "ar-DZ" : "en-US", {
    day: "numeric",
    month: "short",
  })
}

/** Avoids hydration mismatch: server vs client differ for Date.now() / locale formatting. */
function ClientRelativeTime({ iso, isAr }: { iso: string; isAr: boolean }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return (
    <span className="tabular-nums">
      {mounted ? formatRelative(iso, isAr) : "\u00a0"}
    </span>
  )
}

function NotificationRow({
  n,
  isAr,
  onRead,
}: {
  n: NotificationDto
  isAr: boolean
  onRead: (id: string) => void
}) {
  const href =
    n.link && n.link.startsWith("/") ? n.link : n.link ? `/${n.link}` : null

  const content = (
    <>
      <p className="text-sm font-medium leading-tight text-foreground">
        {n.title}
      </p>
      <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
      <p className="text-[10px] text-muted-foreground">
        <ClientRelativeTime iso={n.created_at} isAr={isAr} />
      </p>
    </>
  )

  return (
    <div className="border-b border-border px-3 py-2.5 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          {href ? (
            <Link
              href={href}
              className="block rounded-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onRead(n.id)}
            >
              {content}
            </Link>
          ) : (
            content
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-xs rounded-sm"
          onClick={() => onRead(n.id)}
        >
          {isAr ? "تم" : "Read"}
        </Button>
      </div>
    </div>
  )
}

export default function NotificationBell() {
  const { language } = useLanguage()
  const isAr = language === "ar"
  const {
    items,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllRead,
  } = useNotifications()

  const unread = items.filter((n) => !n.read)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          
          size="icon"
          className="relative h-10 w-10 shrink-0 rounded-full bg-[#FEF9F9] text-[#1B2065] hover:bg-[#EEF4F7] dark:bg-[#242A40] dark:text-[#EEF4F7] dark:hover:bg-[#2E3650]"
          aria-label={isAr ? "الإشعارات" : "Notifications"}
          aria-busy={loading}
        >
          {loading ? (
            <Loader2
              className="size-[22px] animate-spin text-[#5D719D] dark:text-[#9BA8C4]"
              aria-hidden
            />
          ) : (
            <Bell className="size-[20px] text-[#5D719D] dark:text-[#9BA8C4]" />
          )}
          {!loading && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] leading-none"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isAr ? "start" : "end"}
        className="w-[min(100vw-2rem,22rem)] border-[#D6DEEF] bg-[#FEF9F9]/95 p-0 shadow-xl backdrop-blur-xl dark:border-[#383F58] dark:bg-[#1A2036]/95"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b border-border px-3 py-2">
          <p className="text-sm font-semibold text-foreground">
            {isAr ? "الإشعارات" : "Notifications"}
          </p>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div
              className="space-y-2.5 p-3"
              role="status"
              aria-live="polite"
              aria-label={isAr ? "جارٍ التحميل…" : "Loading notifications…"}
            >
              <Skeleton className="h-14 w-full rounded-lg bg-muted/90 ring-1 ring-border/60" />
              <Skeleton className="h-14 w-full rounded-lg bg-muted/90 ring-1 ring-border/60" />
              <Skeleton className="h-14 w-full rounded-lg bg-muted/90 ring-1 ring-border/60" />
            </div>
          )}

          {!loading && unread.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {isAr ? "لا توجد إشعارات جديدة." : "No new notifications."}
            </p>
          )}

          {!loading &&
            unread.map((n) => (
              <NotificationRow
                key={n.id}
                n={n}
                isAr={isAr}
                onRead={(id) => void markAsRead(id)}
              />
            ))}
        </div>

        {unread.length > 0 && (
          <div className="border-t border-border p-2 hover:bg-white/10 rounded-md">
            <Button
              type="button"
              className="w-full"
              size="sm"
              onClick={() => void markAllRead()}
            >
              {isAr ? "تعليم الكل كمقروء" : "Mark all as read"}
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
