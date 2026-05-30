"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ClipboardClock, FileWarning } from "lucide-react";
import { useLanguage } from "@/app/_components/language-provider";
import NotificationPermissionPrompt from "@/app/_components/notifications/NotificationPermissionPrompt";
import DashboardControlCenterHeader from "@/app/_components/dashboard/DashboardControlCenterHeader";
import { StudentDashboardCharts } from "@/app/_components/dashboard/DashboardCharts";
import { Button } from "@/components/ui/button";
import {
  fetchStudentDashboardCharts,
  fetchStudentDashboardMetrics,
  formatDashboardCount,
  type StudentDashboardCharts as StudentChartsData,
} from "@/lib/dashboardMetrics";
import { notifyStudentAbsenceRisk } from "@/lib/studentAbsenceAlerts";

export default function StudentDashboardView() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const isRtl = dir === "rtl";

  const [metrics, setMetrics] = useState<{
    pendingJustifications: number;
    sessionsToday: number;
  } | null>(null);
  const [charts, setCharts] = useState<StudentChartsData | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void fetchStudentDashboardMetrics().then((m) => {
      if (alive) setMetrics(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    queueMicrotask(() => {
      if (alive) setChartsLoading(true);
    });
    void fetchStudentDashboardCharts(isAr).then((m) => {
      if (alive) {
        setCharts(m);
        setChartsLoading(false);
        notifyStudentAbsenceRisk(
          m.absencesByModule.map((row) => ({
            name: row.label,
            unjustified: row.value,
            justified: 0,
          })),
          isAr
        );
      }
    });
    return () => {
      alive = false;
    };
  }, [isAr]);

  return (
    <div className="w-full max-w-6xl space-y-8">
      <NotificationPermissionPrompt context="dashboard-home" />
      <DashboardControlCenterHeader>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#51689A] dark:text-[#C8D4EC]">
          {isAr ? "طالب" : "Student"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1B2065] md:text-3xl dark:text-[#EEF4F7]">
          {isAr ? "مساحتك الدراسية" : "Student control center"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#51689A] dark:text-[#9BA8C4]">
          {isAr
            ? "تابع حضورك، حصصك، ومبررات الغياب."
            : "Track attendance, your sessions, and justifications."}
        </p>
      </DashboardControlCenterHeader>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#1B2065] dark:text-[#EEF4F7]">
              {isAr ? "حصصك" : "Your Sessions"}
            </h2>
            <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
              {isAr
                ? "اطّلع على جدولك وحصصك."
                : "View your timetable and sessions."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-[#51689A] text-[#1B2065] hover:bg-[#74A7BD]/15 dark:border-[#383F58] dark:text-[#EEF4F7] dark:hover:bg-[#242A40]"
            asChild
          >
            <Link href="/Sessions" className="inline-flex items-center gap-1">
              {isAr ? "كل الحصص" : "All sessions"}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-[#51689A]/20 bg-[#FEF9F9] p-4 shadow-sm transition-colors hover:border-[#74A7BD]/35 hover:bg-[#F6F7FE] dark:border-[#383F58] dark:bg-[#1A2036] dark:hover:border-[#74A7BD]/25 dark:hover:bg-[#242A40]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
              {isAr ? "حصص اليوم" : "Sessions today"}
            </p>
            <ClipboardClock size={18} className="shrink-0 text-[#74A7BD]" />
          </div>
          <p className="pt-2 text-2xl font-semibold tabular-nums text-[#1B2065] dark:text-[#EEF4F7]">
            {metrics != null
              ? formatDashboardCount(metrics.sessionsToday)
              : "—"}
          </p>
        </article>
        <article className="rounded-xl border border-[#51689A]/20 bg-[#FEF9F9] p-4 shadow-sm transition-colors hover:border-[#74A7BD]/35 hover:bg-[#F6F7FE] dark:border-[#383F58] dark:bg-[#1A2036] dark:hover:border-[#74A7BD]/25 dark:hover:bg-[#242A40]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
              {isAr ? "مبررات قيد المراجعة" : "Justifications pending"}
            </p>
            <FileWarning size={18} className="shrink-0 text-[#74A7BD]" />
          </div>
          <p className="pt-2 text-2xl font-semibold tabular-nums text-[#1B2065] dark:text-[#EEF4F7]">
            {metrics != null
              ? formatDashboardCount(metrics.pendingJustifications)
              : "—"}
          </p>
        </article>
      </section>

      <StudentDashboardCharts
        charts={charts}
        isAr={isAr}
        isRtl={isRtl}
        loading={chartsLoading}
      />
    </div>
  );
}
