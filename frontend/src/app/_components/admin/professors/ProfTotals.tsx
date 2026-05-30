"use client";

import { useEffect, useState } from "react";
import TotalStaff from "../TotalStaff";
import { Activity, BookMarked, UserCircle } from "lucide-react";
import { useLanguage } from "@/app/_components/language-provider";
import {
  fetchAdminTotalsStats,
  formatDashboardCount,
  formatPercent,
  type AdminTotalsStats,
} from "@/lib/adminTotalsMetrics";
import { subscribeAdminCsvUploadSuccess } from "@/lib/adminCsvUploadRefresh";

export default function ProfTotals() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [stats, setStats] = useState<AdminTotalsStats | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      void fetchAdminTotalsStats().then((m) => {
        if (alive) setStats(m);
      });
    };
    load();
    const unsub = subscribeAdminCsvUploadSuccess("teacher", load);
    return () => {
      alive = false;
      unsub();
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
          label={isArabic ? "إجمالي الأساتذة" : "Total Professors"}
          icon={<UserCircle strokeWidth={1.75} />}
          count={
            stats ? formatDashboardCount(stats.teachers.total) : "—"
          }
        />
        <TotalStaff
          showMenu={false}
          label={isArabic ? "المواد المغطاة" : "Modules Covered"}
          icon={<BookMarked strokeWidth={1.75} />}
          count={
            stats ? formatDashboardCount(stats.modules_covered) : "—"
          }
          footer={
            <p className="font-medium text-[#6CB4B4]">
              {isArabic ? "عبر جميع المستويات" : "Across All levels"}
            </p>
          }
        />
        <TotalStaff
          showMenu={false}
          label={isArabic ? "معدل الغياب المتوسط" : "Average Absence Rate"}
          icon={<Activity strokeWidth={1.75} />}
          count={
            stats ? formatPercent(stats.average_absence_rate) : "—"
          }
          footer={
            <p className="font-medium text-[#6CB4B4]">
              {isArabic ? "عبر جميع الحصص" : "Across All Sessions"}
            </p>
          }
        />
      </div>
    </section>
  );
}
