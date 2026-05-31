"use client";

import { useEffect, useState } from "react";
import TotalStaff from "../TotalStaff";
import { CircleCheckBig, MailWarning, Users } from "lucide-react";
import { useLanguage } from "@/app/_components/language-provider";
import {
  fetchAdminTotalsStats,
  formatDashboardCount,
  formatPercent,
  type AdminTotalsStats,
} from "@/lib/adminTotalsMetrics";
import { subscribeAdminCsvUploadSuccess } from "@/lib/adminCsvUploadRefresh";
import { PROF_SESSION_SAVED_EVENT } from "@/lib/professorSessionEvents";

export default function StudTotals() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [stats, setStats] = useState<AdminTotalsStats | null>(null);

  useEffect(() => {
    let alive = true;
    const load = (cacheBust = false) => {
      void fetchAdminTotalsStats({ cacheBust }).then((m) => {
        if (alive) setStats(m);
      });
    };
    load();
    const unsub = subscribeAdminCsvUploadSuccess("student", load);
    const onSessionSaved = () => load(true);
    window.addEventListener(PROF_SESSION_SAVED_EVENT, onSessionSaved);
    return () => {
      alive = false;
      unsub();
      window.removeEventListener(PROF_SESSION_SAVED_EVENT, onSessionSaved);
    };
  }, []);

  return (
    <section
      className="relative mx-auto w-full min-w-0 max-w-6xl overflow-hidden rounded-2xl border border-[#74A7BD]/25 bg-gradient-to-br from-[#74A7BD]/10 via-[#FEF9F9] to-[#FEF9F9] p-4 shadow-sm md:p-5 dark:border-[#51689A]/25 dark:from-[#51689A]/14 dark:via-[#1C2236] dark:to-[#151A28]"
    >
      <div className="pointer-events-none absolute -end-16 top-0 h-44 w-44 rounded-full bg-fuchsia-200/35 blur-3xl dark:bg-[#51689A]/10" />
      <div className="pointer-events-none absolute -end-20 top-8 h-48 w-48 rounded-full bg-[#74A7BD]/12 blur-3xl dark:bg-[#74A7BD]/8" />
      <div className="pointer-events-none absolute end-8 bottom-0 h-32 w-32 rounded-full bg-sky-200/25 blur-2xl dark:bg-[#182449]/15" />
      <div className="relative z-10 grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <TotalStaff
          showMenu={false}
          label={isArabic ? "إجمالي الطلاب" : "Total Students"}
          icon={<Users strokeWidth={1.75} />}
          count={
            stats ? formatDashboardCount(stats.students.total) : "—"
          }
        />
        <TotalStaff
          showMenu={false}
          label={isArabic ? "غياب غير مبرر" : "Unjustified Absences"}
          icon={<MailWarning strokeWidth={1.75} />}
          count={
            stats
              ? formatDashboardCount(stats.unjustified_absences)
              : "—"
          }
          footer={
            <p>
              <span className="font-bold text-[#EE5D50]">
                {stats
                  ? formatPercent(stats.unjustified_rate_by_year)
                  : "—"}
              </span>{" "}
              <span className="text-[#707EAE] dark:text-[#9BA8C4]">
                {isArabic ? "في المتوسط سنويًا" : "On average for each year"}
              </span>
            </p>
          }
        />
        <TotalStaff
          showMenu={false}
          label={isArabic ? "معدل الغياب المبرر" : "Justified Absence Rate"}
          icon={<CircleCheckBig strokeWidth={1.75} />}
          count={
            stats
              ? formatPercent(stats.justified_absence_rate)
              : "—"
          }
          footer={
            <p className="font-medium text-[#6CB4B4]">
              {isArabic ? "من إجمالي الغياب" : "Of all absences"}
            </p>
          }
        />
      </div>
    </section>
  );
}
