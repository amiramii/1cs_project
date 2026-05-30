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
import { ProfessorDashboardCharts } from "@/app/_components/dashboard/DashboardCharts";
import {
  fetchProfessorDashboardCharts,
  fetchProfessorDashboardMetrics,
  formatDashboardCount,
  type ProfessorDashboardCharts as ProfessorChartsData,
} from "@/lib/dashboardMetrics";

export default function ProfessorDashboardView() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const isRtl = dir === "rtl";

  const [stats, setStats] = useState<{
    sessionsToday: number;
    yourStudents: number;
    activeSchedules: number;
    roomsInUse: number;
  } | null>(null);
  const [charts, setCharts] = useState<ProfessorChartsData | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void fetchProfessorDashboardMetrics(isAr).then((m) => {
      if (alive) setStats(m);
    });
    return () => {
      alive = false;
    };
  }, [isAr]);

  useEffect(() => {
    let alive = true;
    queueMicrotask(() => {
      if (alive) setChartsLoading(true);
    });
    void fetchProfessorDashboardCharts(isAr).then((m) => {
      if (alive) {
        setCharts(m);
        setChartsLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [isAr]);

  const cards = [
    {
      label: isAr ? "حصص اليوم" : "Sessions today",
      value: stats ? formatDashboardCount(stats.sessionsToday) : "—",
      icon: ClipboardClock,
    },
    {
      label: isAr ? "طلابك" : "Your students",
      value: stats ? formatDashboardCount(stats.yourStudents) : "—",
      icon: GraduationCap,
    },
    {
      label: isAr ? "جداول نشطة" : "Active schedules",
      value: stats ? formatDashboardCount(stats.activeSchedules) : "—",
      icon: CalendarCheck2,
    },
    {
      label: isAr ? "قاعات مرتبطة" : "Rooms in use",
      value: stats ? formatDashboardCount(stats.roomsInUse) : "—",
      icon: UserRoundPen,
    },
  ];

  return (
    <div className="w-full max-w-6xl space-y-8">
      <NotificationPermissionPrompt context="dashboard-home" />
      <DashboardControlCenterHeader>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#51689A] dark:text-[#C8D4EC]">
          {isAr ? "أستاذ" : "Professor"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1B2065] md:text-3xl dark:text-[#EEF4F7]">
          {isAr ? "مساحة التدريس" : "Professor control center"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#51689A] dark:text-[#9BA8C4]">
          {isAr
            ? "ركّز على حصصك، طلابك، وجدولك دون عناصر إشراف عامة."
            : "Focus on your sessions, your students, and your schedule—without global admin tools."}
        </p>
      </DashboardControlCenterHeader>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
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

      <ProfessorDashboardCharts
        charts={charts}
        isAr={isAr}
        isRtl={isRtl}
        loading={chartsLoading}
      />
    </div>
  );
}
