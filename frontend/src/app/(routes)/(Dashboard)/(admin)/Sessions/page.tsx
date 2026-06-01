"use client"

/**
 * `/Sessions` — admin links to schedule management; professors manage attendance here.
 * Students use Schedules (`/Scheduals`) and Absences only — no Sessions tab.
 */

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CalendarCheck, ClipboardClock, Info } from "lucide-react"

import { useLanguage } from "@/app/_components/language-provider"
import ProfessorSessionsView from "@/app/_components/sessions/ProfessorSessionsView"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants"
import { getAccessToken } from "@/lib/tokenStorage"
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole"

export default function Page() {
  const router = useRouter()
  const { language } = useLanguage()
  const isAr = language === "ar"
  const role = useEffectiveAppRole("admin")

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) return
    const token = getAccessToken()
    if (!token) {
      router.push("/Login")
      return
    }
    if (role === "student") {
      router.replace("/Dashboard")
    }
  }, [router, role])

  if (role === "student") {
    return null
  }

  if (role === "admin") {
    return (
      <div className="w-full max-w-4xl space-y-6">
        <Alert>
          <Info aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <AlertTitle>
              {isAr ? "الحصص والجداول المنشورة" : "Published sessions & schedules"}
            </AlertTitle>
            <AlertDescription>
              {isAr
                ? "كمسؤول، افتح قائمة جداول الأساتذة أو الطلاب. المحتوى هنا يختلف عن ما يراه الأستاذ في صفحة «الحصص»."
                : "As an admin, open either professor or student schedule lists. This is separate from what teachers see under Sessions."}
            </AlertDescription>
          </div>
        </Alert>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/Scheduals/Professor-Schedules"
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/40"
          >
            <CalendarCheck className="size-8 text-primary" />
            <span className="font-medium text-foreground">
              {isAr ? "جداول الأساتذة" : "Professor schedules"}
            </span>
            <span className="text-xs text-muted-foreground">
              {isAr ? "عرض وإدارة جداول التدريس" : "View and manage teaching timetables"}
            </span>
          </Link>
          <Link
            href="/Scheduals/Student-Schedules"
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/40"
          >
            <ClipboardClock className="size-8 text-primary" />
            <span className="font-medium text-foreground">
              {isAr ? "جداول الطلاب" : "Student schedules"}
            </span>
            <span className="text-xs text-muted-foreground">
              {isAr ? "عرض الجداول حسب السنة والشعبة" : "View schedules by year and section"}
            </span>
          </Link>
        </div>
      </div>
    )
  }

  if (role === "prof") {
    return (
      <div className="mx-auto w-full min-w-0 space-y-4 xl:p-5">
        <ProfessorSessionsView />
      </div>
    )
  }

  return null
}
