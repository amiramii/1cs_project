"use client";

import ProfessorAbsencesView from "@/app/_components/absences/ProfessorAbsencesView";
import StudentAbsencesView from "@/app/_components/absences/StudentAbsencesView";
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole";

/**
 * `/Absences` — student module absences or professor absence justifications.
 * Role access is enforced by `DashboardRoleGuard`.
 */
export default function Page() {
  const role = useEffectiveAppRole("admin");

  if (role !== "student" && role !== "prof") {
    return null;
  }

  if (role === "prof") {
    return <ProfessorAbsencesView />;
  }

  return <StudentAbsencesView />;
}
