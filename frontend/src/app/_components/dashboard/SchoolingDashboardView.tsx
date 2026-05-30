"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck2,
  ClipboardClock,
  GraduationCap,
  UserRoundPen,
} from "lucide-react";
import { useLanguage } from "@/app/_components/language-provider";
import NotificationPermissionPrompt from "@/app/_components/notifications/NotificationPermissionPrompt";
import DashboardControlCenterHeader from "@/app/_components/dashboard/DashboardControlCenterHeader";
import { SchoolingDashboardCharts } from "@/app/_components/dashboard/DashboardCharts";
import ModuleExclusionPolicyCard from "@/app/_components/dashboard/ModuleExclusionPolicyCard";
import {
  fetchAdminLikeDashboardMetrics,
  fetchSchoolingDashboardCharts,
  formatDashboardCount,
  type SchoolingDashboardCharts as SchoolingChartsData,
} from "@/lib/dashboardMetrics";

export default function SchoolingDashboardView() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const isRtl = dir === "rtl";

  const [stats, setStats] = useState<{
    teachers: number;
    students: number;
    schedules: number;
    sessionsToday: number;
  } | null>(null);
  const [charts, setCharts] = useState<SchoolingChartsData | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void fetchAdminLikeDashboardMetrics().then((m) => {
      if (alive) setStats(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setChartsLoading(true);
    void fetchSchoolingDashboardCharts(isAr).then((m) => {
      if (alive) {
        setCharts(m);
        setChartsLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [isAr]);

  const statCards = [
    {
      id: "professors" as const,
      label: isAr ? "الأساتذة" : "Professors",
      value: stats ? formatDashboardCount(stats.teachers) : "—",
      icon: UserRoundPen,
    },
    {
      id: "students" as const,
      label: isAr ? "الطلاب" : "Students",
      value: stats ? formatDashboardCount(stats.students) : "—",
      icon: GraduationCap,
    },
    {
      id: "schedules" as const,
      label: isAr ? "الجداول" : "Schedules",
      value: stats ? formatDashboardCount(stats.schedules) : "—",
      icon: CalendarCheck2,
    },
    {
      id: "sessions" as const,
      label: isAr ? "الحصص اليوم" : "Sessions today",
      value: stats ? formatDashboardCount(stats.sessionsToday) : "—",
      icon: ClipboardClock,
    },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-8">
      <NotificationPermissionPrompt context="dashboard-home" />
      <DashboardControlCenterHeader>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#51689A] dark:text-[#C8D4EC]">
          {isAr ? "الشؤون الأكاديمية" : "Schooling office"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1B2065] md:text-3xl dark:text-[#EEF4F7]">
          {isAr ? "لوحة الإشراف" : "Schooling control center"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#51689A] dark:text-[#9BA8C4]">
          {isAr
            ? "مراجعة مبررات الغياب وطلبات الأساتذة والحصص من مكان واحد."
            : "Review justifications, professor absences, and session requests in one place."}
        </p>
      </DashboardControlCenterHeader>

      <ModuleExclusionPolicyCard canEdit={false} />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article
            key={card.id}
            className="rounded-xl border border-[#51689A]/20 bg-[#FEF9F9] p-4 shadow-sm transition-colors hover:border-[#74A7BD]/35 hover:bg-[#F6F7FE] dark:border-[#383F58] dark:bg-[#1A2036] dark:hover:border-[#74A7BD]/25 dark:hover:bg-[#242A40]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">{card.label}</p>
              <card.icon size={18} className="shrink-0 text-[#74A7BD]" />
            </div>
            <p className="pt-2 text-2xl font-semibold tabular-nums text-[#1B2065] dark:text-[#EEF4F7]">
              {card.value}
            </p>
          </article>
        ))}
      </section>

      <SchoolingDashboardCharts
        charts={charts}
        isAr={isAr}
        isRtl={isRtl}
        loading={chartsLoading}
      />
    </div>
  );
}
