"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RouteLoadingShell from "@/app/_components/RouteLoadingShell";
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants";
import { getAccessToken } from "@/lib/tokenStorage";
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole";
import AdminDashboardView from "@/app/_components/dashboard/AdminDashboardView";
import ProfessorDashboardView from "@/app/_components/dashboard/ProfessorDashboardView";
import StudentDashboardView from "@/app/_components/dashboard/StudentDashboardView";
import SchoolingDashboardView from "@/app/_components/dashboard/SchoolingDashboardView";
import NotificationPermissionPrompt from "@/app/_components/notifications/NotificationPermissionPrompt";

export default function Page() {
  const router = useRouter();
  const role = useEffectiveAppRole();

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) return;
    const token = getAccessToken();
    if (!token) {
      router.push("/Login");
    }
  }, [router]);

  if (!role) {
    return <RouteLoadingShell />;
  }

  if (role === "prof") {
    return <ProfessorDashboardView />;
  }
  if (role === "student") {
    return <StudentDashboardView />;
  }
  if (role === "schooling") {
    return <SchoolingDashboardView/>;
  }
  if (role === "admin") {
    return <AdminDashboardView />;
  }

  return <RouteLoadingShell />;
}
