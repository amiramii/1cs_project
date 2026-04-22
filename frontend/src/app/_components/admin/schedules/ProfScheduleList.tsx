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
