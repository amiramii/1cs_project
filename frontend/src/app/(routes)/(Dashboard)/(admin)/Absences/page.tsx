"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import StudentAbsencesView from "@/app/_components/absences/StudentAbsencesView";
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants";
import { getAccessToken } from "@/lib/tokenStorage";
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole";

/**
 * `/Absences` — student absence summary (per-module list). Other roles are redirected.
 */
export default function Page() {
  const router = useRouter();
  const role = useEffectiveAppRole("admin");

  useEffect(() => {
    if (role !== "student") {
      router.replace("/Dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) return;
    const token = getAccessToken();
    if (!token) router.push("/Login");
  }, [router]);

  if (role !== "student") {
    return null;
  }

  return <StudentAbsencesView />;
}
