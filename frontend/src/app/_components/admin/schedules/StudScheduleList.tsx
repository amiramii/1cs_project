"use client"

import { DEFAULT_APP_ROLE } from "@/lib/constants"
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole"
import ScheduleListShell from "./ScheduleListShell"

export default function StudScheduleList() {
  const role = useEffectiveAppRole(DEFAULT_APP_ROLE)
  const allowDelete = role === "admin"
  const isStudentRole = role === "student"

  return (
    <ScheduleListShell
      titleEn={isStudentRole ? "Your Schedules" : "Student Schedules"}
      titleAr={isStudentRole ? "جداولك" : "جداول الطلاب"}
      subtitleEn={
        isStudentRole ? "Check your most important schedules" : undefined
      }
      subtitleAr={
        isStudentRole ? "اطّلع على أهم جداولك الدراسية" : undefined
      }
      backHref="/Scheduals/Professor-Schedules"
      nextHref="/Scheduals"
      backLabelEn="Professors"
      backLabelAr="الأساتذة"
      nextLabelEn="Back to Upload"
      nextLabelAr="العودة للتحميل"
      audience="student"
      allowDelete={allowDelete}
      hideTopNavigation={isStudentRole}
      studentBrowse={isStudentRole}
    />
  )
}
