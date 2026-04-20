import ScheduleListShell from "./ScheduleListShell"

export default function StudScheduleList() {
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
      layout="single"
    />
  )
}
