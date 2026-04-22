"use client"

/**
 * Justifications workspace — content depends on who is logged in:
 * - `admin`: oversight / moderation view (full queue when API is wired).
 * - `schooling`: academic office (scolarité) — primary workflow per sidebar config.
 * - `student`: personal submissions and statuses.
 *
 * We surface the Web Notifications permission prompt so each audience can opt in
 * before backend-driven events (new request, status change) arrive.
 */

import { useEffect } from "react"
import { Info } from "lucide-react"

import { useLanguage } from "@/app/_components/language-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getNotificationPermission, notifyUser } from "@/lib/utils"

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
          ? "ستصلك إشعارات عند وصول طلبات مبررات جديدة (عند ربط الـ API)."
          : "You will get alerts for new justification requests (once the API is connected).",
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
      <div className="w-full max-w-4xl space-y-4">
        <Alert>
          <Info aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <AlertTitle>
              {isAr ? "مبررات الغياب — الإشراف" : "Absence justifications — admin"}
            </AlertTitle>
            <AlertDescription>
              {isAr
                ? "راجع كل الطلبات، غيّر الحالات، وصدّر التقارير. هذه الواجهة للمسؤولين فقط."
                : "Review all requests, change statuses, and export reports. This workspace is for administrators only."}
            </AlertDescription>
          </div>
        </Alert>

        <Alert variant="default" className="border-dashed border-[#51689A]/35 bg-[#F6F7FE]">
          <Info aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <AlertTitle>
              {isAr ? "الربط مع الخادم" : "API integration"}
            </AlertTitle>
            <AlertDescription>
              {isAr
                ? "سيتم ربط هذه الصفحة بقائمة الطلبات من الـ API لاحقًا."
                : "Connect this view to your API list of justification requests when ready."}
            </AlertDescription>
          </div>
        </Alert>
      </div>
    )
  }

  if (role === "schooling") {
    return (
      <div className="w-full max-w-4xl space-y-4">
        <Alert>
          <Info aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <AlertTitle>
              {isAr
                ? "مبررات الغياب — الشؤون التعليمية"
                : "Absence justifications — schooling office"}
            </AlertTitle>
            <AlertDescription>
              {isAr
                ? "هنا تعالج طلبات الغياب المبررة: القبول، الرفض، أو طلب مستندات إضافية."
                : "Process justified absence requests: approve, reject, or ask for more documents."}
            </AlertDescription>
          </div>
        </Alert>

        <Alert variant="default" className="border-dashed border-[#51689A]/35 bg-[#F6F7FE]">
          <Info aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <AlertTitle>
              {isAr ? "قائمة الطلبات" : "Request queue"}
            </AlertTitle>
            <AlertDescription>
              {isAr
                ? "سيتم ربط هذه الصفحة بقائمة الطلبات من الـ API لاحقًا."
                : "Connect this view to your API list of justification requests when ready."}
            </AlertDescription>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <Alert className="border-[#1B2065]/25 bg-[#1B2065]/10">
        <Info aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <AlertTitle>{isAr ? "مبرراتي" : "My justifications"}</AlertTitle>
          <AlertDescription>
            {isAr
              ? "قدّم طلبًا جديدًا أو تابع حالة طلباتك السابقة."
              : "Submit a new request or track the status of your previous submissions."}
          </AlertDescription>
        </div>
      </Alert>

      <Alert variant="default" className="border-dashed border-[#51689A]/35 bg-[#F6F7FE]">
        <Info aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <AlertTitle>{isAr ? "النموذج والقائمة" : "Form & list"}</AlertTitle>
          <AlertDescription>
            {isAr
              ? "نموذج الطلب والقائمة ستُربط بالخلفية لاحقًا."
              : "The submission form and list will be wired to the backend next."}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  )
}
