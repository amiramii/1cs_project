"use client"

import { DEFAULT_APP_ROLE } from "@/lib/constants"
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole"
import ScheduleListShell from "./ScheduleListShell"

export default function StudScheduleList() {
  const role = useEffectiveAppRole(DEFAULT_APP_ROLE)
  const allowDelete = role === "admin"

  return (
    <ScheduleListShell
      titleEn="Student Schedules"
      titleAr="جداول الطلاب"
      backHref="/Scheduals/Professor-Schedules"
      nextHref="/Scheduals"
      backLabelEn="Professors"
      backLabelAr="الأساتذة"
      nextLabelEn="Back to Upload"
      nextLabelAr="العودة للتحميل"
      audience="student"
      allowDelete={allowDelete}
    />
  )
}
