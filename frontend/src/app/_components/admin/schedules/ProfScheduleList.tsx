import ScheduleListShell from "./ScheduleListShell"

export type ProfScheduleListProps = {
  /** `prof-tab` = layout for professor `/Scheduals` (title, toolbar, grid only). */
  variant?: "full" | "prof-tab"
}

export default function ProfScheduleList({
  variant = "full",
}: ProfScheduleListProps) {
  const isProfTab = variant === "prof-tab"

  return (
    <ScheduleListShell
      titleEn={isProfTab ? "Your Schedules" : "Professors Schedules"}
      titleAr={isProfTab ? "جداولك" : "جداول الأساتذة"}
      subtitleEn={
        isProfTab
          ? "PDF timetables for viewing only. Rosters and teaching assignments come from admin CSV import; attendance sessions are managed under Sessions—not generated from these PDFs."
          : undefined
      }
      subtitleAr={
        isProfTab
          ? "ملفات PDF للاطلاع فقط. قوائم الطلاب والتعيينات التدريسية تُستورد من CSV في حساب المسؤول؛ حصص الحضور تُدار من تبويب الحصص ولا تُنشأ من هذه PDF."
          : undefined
      }
      backHref="/Scheduals"
      nextHref="/Scheduals/Student-Schedules"
      backLabelEn="Back"
      backLabelAr="رجوع"
      nextLabelEn="Students"
      nextLabelAr="الطلاب"
      audience="professor"
      allowDelete={!isProfTab}
      hideTopNavigation={isProfTab}
      pdfCardLayout={isProfTab ? "stacked" : "default"}
    />
  )
}
