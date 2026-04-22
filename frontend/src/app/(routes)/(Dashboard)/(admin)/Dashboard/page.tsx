"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants";
import { getAccessToken } from "@/lib/tokenStorage";
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole";
import AdminDashboardView from "@/app/_components/dashboard/AdminDashboardView";
import ProfessorDashboardView from "@/app/_components/dashboard/ProfessorDashboardView";
import StudentDashboardView from "@/app/_components/dashboard/StudentDashboardView";
import NotificationPermissionPrompt from "@/app/_components/notifications/NotificationPermissionPrompt";

export default function Page() {
  const router = useRouter();
  const role = useEffectiveAppRole("admin");

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) return;
    const token = getAccessToken();
    if (!token) {
      router.push("/Login");
    }
  }, [router]);

  if (role === "prof") {
    return <ProfessorDashboardView />;
  }
  if (role === "student") {
    return <StudentDashboardView />;
  }
  if (role === "schooling") {
    return (
      <div
        className="flex min-h-[calc(100vh-5rem)] w-full flex-1 flex-col gap-4"
        aria-label="Schooling dashboard placeholder"
      >
        <NotificationPermissionPrompt context="dashboard-home" />
      </div>
    );
  }

  return <AdminDashboardView />;
}
