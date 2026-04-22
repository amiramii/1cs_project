"use client"

/**
 * Inline prompt that explains why we ask for notification permission and lets the
 * user opt in. Uses shadcn `Alert` + Lucide `Bell` (notification bell icon).
 *
 * When the user grants permission we fire a one-off confirmation notification
 * via `notifyUser` so they immediately see that it works.
 */

import { useState, useSyncExternalStore } from "react"
import { Bell } from "lucide-react"

import { useLanguage } from "@/app/_components/language-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  getNotificationPermission,
  notifyUser,
  requestNotificationPermission,
} from "@/lib/utils"

/** Where this prompt is shown — drives localized copy and future analytics hooks. */
export type NotificationContext =
  | "dashboard-home"
  | "justifications-schooling"
  | "justifications-student"
  | "justifications-admin"
  | "sessions-prof"
  | "sessions-student"

const copy: Record<
  NotificationContext,
  { titleEn: string; titleAr: string; descEn: string; descAr: string }
> = {
  "dashboard-home": {
    titleEn: "Dashboard notifications",
    titleAr: "إشعارات لوحة التحكم",
    descEn:
      "Enable browser notifications so we can alert you about important events while you use Chekin.",
    descAr:
      "فعّل إشعارات المتصفح لنرسل لك تنبيهات مهمة أثناء استخدام تشيكن.",
  },
  "justifications-schooling": {
    titleEn: "Justification alerts (schooling)",
    titleAr: "تنبيهات المبررات (الشؤون التعليمية)",
    descEn:
      "Enable notifications to get alerted when students submit new absence justifications or when you need to review the queue.",
    descAr:
      "فعّل الإشعارات لتصلك تنبيهات عند تقديم طلبات مبررات جديدة أو عند الحاجة لمراجعة القائمة.",
  },
  "justifications-student": {
    titleEn: "Justification updates",
    titleAr: "تحديثات المبررات",
    descEn:
      "We will notify you when your justification request is approved, rejected, or needs more information.",
    descAr:
      "سنُرسل إشعارًا عند قبول طلبك أو رفضه أو عند الحاجة لمعلومات إضافية.",
  },
  "justifications-admin": {
    titleEn: "Admin justification alerts",
    titleAr: "تنبيهات المبررات (الإدارة)",
    descEn:
      "Optional notifications for high-priority justification events while you review the full list.",
    descAr:
      "إشعارات اختيارية لأحداث المبررات ذات الأولوية أثناء مراجعة القائمة الكاملة.",
  },
  "sessions-prof": {
    titleEn: "Session reminders",
    titleAr: "تذكيرات الحصص",
    descEn:
      "Get notified when attendance is saved, a session is created, or you open a session—useful when the tab is in the background.",
    descAr:
      "استلم إشعارات عند حفظ الحضور أو إنشاء حصة أو فتح حصة—مفيد عندما تكون العلامة في الخلفية.",
  },
  "sessions-student": {
    titleEn: "Timetable ready",
    titleAr: "الجدول جاهز",
    descEn:
      "We can notify you when your published timetable finishes loading so you do not have to watch the spinner.",
    descAr:
      "يمكننا إشعارك عند اكتمال تحميل جدولك المنشور دون أن تتتبع التحميل يدويًا.",
  },
}

export default function NotificationPermissionPrompt({
  context,
}: {
  context: NotificationContext
}) {
  const { language } = useLanguage()
  const isAr = language === "ar"
  const c = copy[context]

  /**
   * Browser permission state (no real subscription — permission only changes via
   * our `onEnable` handler, which updates `override`).
   */
  const live = useSyncExternalStore(
    () => () => {},
    () => getNotificationPermission(),
    () => null as NotificationPermission | "unsupported" | null
  )
  /**
   * Stores the result after the user clicks “Enable” (or we map unsupported →
   * denied). Takes precedence over `live` so the UI updates immediately.
   */
  const [override, setOverride] = useState<
    NotificationPermission | "unsupported" | null
  >(null)

  const perm = override ?? live

  const title = isAr ? c.titleAr : c.titleEn
  const description = isAr ? c.descAr : c.descEn

  const onEnable = async () => {
    const next = await requestNotificationPermission()
    setOverride(next === "unsupported" ? "denied" : next)
    if (next === "granted") {
      await notifyUser({
        title: isAr ? "تم تفعيل الإشعارات" : "Notifications enabled",
        body: isAr
          ? "ستصلك التنبيهات المهمة من هذا التطبيق."
          : "You will receive important alerts from this app.",
        tag: "permission-confirm",
      })
    }
  }

  const effective = perm

  /** Server render and first paint: no `window` yet — keep a neutral skeleton. */
  if (effective === null) {
    return (
      <Alert className="border-dashed opacity-80">
        <Bell className="animate-pulse" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{description}</AlertDescription>
        </div>
      </Alert>
    )
  }

  if (effective === "unsupported") {
    return (
      <Alert variant="destructive" className="border-dashed">
        <Bell aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <AlertTitle>
            {isAr ? "المتصفح لا يدعم الإشعارات" : "Notifications not supported"}
          </AlertTitle>
          <AlertDescription>
            {isAr
              ? "جرّب متصفحًا حديثًا على سطح المكتب للاستفادة من الإشعارات."
              : "Try a modern desktop browser to use system notifications."}
          </AlertDescription>
        </div>
      </Alert>
    )
  }

  if (effective === "granted") {
    return (
      <Alert className="border-primary/25 bg-primary/5">
        <Bell className="text-primary" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <AlertTitle>
            {isAr ? "الإشعارات مفعّلة" : "Notifications are on"}
          </AlertTitle>
          <AlertDescription>
            {isAr
              ? "ستصلك التنبيهات المرتبطة بهذه الصفحة عند حدوث أحداث."
              : "You will receive alerts for events on this page."}
          </AlertDescription>
        </div>
      </Alert>
    )
  }

  if (effective === "denied") {
    return (
      <Alert variant="destructive">
        <Bell aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <AlertTitle>
            {isAr ? "الإشعارات مرفوضة" : "Notifications blocked"}
          </AlertTitle>
          <AlertDescription>
            {isAr
              ? "فعّل الإشعارات من إعدادات الموقع في المتصفح إذا أردت استخدامها."
              : "Enable notifications from the site settings in your browser if you want to use them."}
          </AlertDescription>
        </div>
      </Alert>
    )
  }

  return (
    <Alert className="border-dashed">
      <Bell aria-hidden />
      <div className="min-w-0 flex-1 space-y-2">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{description}</span>
          <Button type="button" size="sm" className="shrink-0" onClick={onEnable}>
            {isAr ? "تفعيل الإشعارات" : "Enable notifications"}
          </Button>
        </AlertDescription>
      </div>
    </Alert>
  )
}
