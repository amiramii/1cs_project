"use client"

/**
 * Justifications workspace — content depends on who is logged in:
 * - `admin`: full review queue from the API (accept / refuse).
 * - `schooling`: academic office UI — table loads from API; student rows open the mock detail page owned by design.
 * - `student`: personal submissions and statuses (`my_justifications` API).
 *
 * We surface the Web Notifications permission prompt so each audience can opt in
 * before backend-driven events (new request, status change) arrive.
 */

import { useEffect } from "react"

import { useLanguage } from "@/app/_components/language-provider"
import { getNotificationPermission, notifyUser } from "@/lib/utils"

import { SchoolingJustificationsTable } from "../admin/justifications/SchoolJustTable"
import StudentJustificationsView from "../justifications/StudentJustificationsView"

export type JustificationsViewerRole = "admin" | "student" | "schooling"

export default function JustificationsByRole({
  role,
}: {
  role: JustificationsViewerRole
}) {
  const { language } = useLanguage()
  const isAr = language === "ar"

  /**
   * One-time “welcome” ping per browser tab session when permission is already
   * granted — helps confirm that schooling/student flows will be able to push
   * real events later without another permission dance.
   */
  useEffect(() => {
    if (getNotificationPermission() !== "granted") return

    if (role === "schooling") {
      const key = "welcome-notif-justifications-schooling"
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
      void notifyUser({
        title: isAr ? "الشؤون التعليمية" : "Schooling office",
        body: isAr
          ? "ستصلك إشعارات عند وصول طلبات مبررات جديدة."
          : "You will get alerts when new justification requests arrive.",
        tag: "welcome-schooling-justifications",
      })
      return
    }

    if (role === "student") {
      const key = "welcome-notif-justifications-student"
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
      void notifyUser({
        title: isAr ? "مبررات الغياب" : "Absence justifications",
        body: isAr
          ? "ستصلك تحديثات عند تغيّر حالة طلبك."
          : "You will be notified when your request status changes.",
        tag: "welcome-student-justifications",
      })
    }
  }, [role, isAr])

  if (role === "admin") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-[#1B2065F2] dark:text-[#EEF4F7]">
          {isAr ? "مبررات الغياب" : "Justifications"}
        </h1>
        <p className="text-lg text-[#51689AF2] dark:text-[#9BA8C4]">
          {isAr
            ? "مراجعة وقبول/رفض المبررات مخصّصة لحسابات الشؤون التعليمية (SCHOOLING) على الخادم. سجّل الدخول بحساب الشؤون لمعالجة الطلبات."
            : "Reviewing and accepting/refusing justifications is handled by schooling office accounts (SCHOOLING role) on the server. Sign in as schooling staff to process requests."}
        </p>
      </div>
    )
  }

  if (role === "schooling") {
    return (
    <div className=" space-y-4">
      <h1 className="text-2xl font-semibold text-[#1B2065F2] dark:text-[#EEF4F7]">
        {isAr ? "مبررات الغياب" : "Justifications"}
      </h1>
      <p className="text-lg text-[#51689AF2] dark:text-[#9BA8C4]">
        {isAr
          ? "مراجعة طلبات التبرير غير المعالجة للطلاب."
          : "Review unchecked student justification requests."}
      </p>
      <SchoolingJustificationsTable />
    </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <StudentJustificationsView />
    </div>
  )
}
