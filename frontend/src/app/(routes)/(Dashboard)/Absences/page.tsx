"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import ProfessorAbsencesView from "@/app/_components/absences/ProfessorAbsencesView";
import StudentAbsencesView from "@/app/_components/absences/StudentAbsencesView";
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants";
import { getAccessToken } from "@/lib/tokenStorage";
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole";

/**
 * `/Absences` — student module absences or professor absence justifications.
 */
export default function Page() {
  const router = useRouter();
  const role = useEffectiveAppRole("admin");

  useEffect(() => {
    if (role !== "student" && role !== "prof") {
      router.replace("/Dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) return;
    const token = getAccessToken();
    if (!token) router.push("/Login");
  }, [router]);

  if (role !== "student" && role !== "prof") {
    return null;
  }

  if (role === "prof") {
    return <ProfessorAbsencesView />;
  }

  return <StudentAbsencesView />;
}
