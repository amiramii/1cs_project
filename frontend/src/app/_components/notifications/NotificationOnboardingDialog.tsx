"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { useLanguage } from "@/app/_components/language-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getNotificationPermission,
  isNotificationApiSupported,
  notifyUser,
  requestNotificationPermission,
} from "@/lib/utils"

const STORAGE_KEY = "chekin_notifications_onboarding_done"

export default function NotificationOnboardingDialog() {
  const { language } = useLanguage()
  const isAr = language === "ar"
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (localStorage.getItem(STORAGE_KEY)) return
    if (!isNotificationApiSupported()) {
      localStorage.setItem(STORAGE_KEY, "1")
      return
    }
    const p = getNotificationPermission()
    if (p === "granted" || p === "denied" || p === "unsupported") {
      localStorage.setItem(STORAGE_KEY, "1")
      return
    }
    setOpen(true)
  }, [])

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "1")
    setOpen(false)
  }

  const onEnable = async () => {
    const next = await requestNotificationPermission()
    if (next === "granted") {
      await notifyUser({
        title: isAr ? "تم تفعيل الإشعارات" : "Notifications enabled",
        body: isAr
          ? "ستصلك تنبيهات النظام عند وجود أحداث جديدة."
          : "You will receive system alerts when new events arrive.",
        tag: "onboarding-confirm",
      })
      toast.success(
        isAr ? "تم تفعيل الإشعارات بنجاح" : "Notifications enabled successfully"
      )
    } else {
      toast.message(
        isAr ? "لم يُمنح الإذن" : "Permission was not granted",
        {
          description: isAr
            ? "يمكنك تفعيلها لاحقًا من إعدادات المتصفح."
            : "You can enable them later from the browser settings.",
        }
      )
    }
    finish()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) finish()
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {isAr ? "تفعيل الإشعارات؟" : "Enable notifications?"}
          </DialogTitle>
          <DialogDescription>
            {isAr
              ? "يمكننا إظهار تنبيهات سطح المكتب عند وصول إشعارات جديدة في المنصة حتى لو كانت النافذة في الخلفية."
              : "We can show desktop alerts when new in-app notifications arrive, even if this tab is in the background."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={finish}>
            {isAr ? "ليس الآن" : "Not now"}
          </Button>
          <Button type="button" onClick={() => void onEnable()}>
            {isAr ? "تفعيل" : "Enable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
