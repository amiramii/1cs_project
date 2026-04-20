import ScheduleListShell from "./ScheduleListShell"

export default function ProfScheduleList() {
  return (
    <ScheduleListShell
      titleEn="Professors Schedules"
      titleAr="جداول الأساتذة"
      backHref="/Scheduals"
      nextHref="/Scheduals/Student-Schedules"
      backLabelEn="Back"
      backLabelAr="رجوع"
      nextLabelEn="Students"
      nextLabelAr="الطلاب"
      audience="professor"
    />
  )
}
