"use client";

import { useEffect, useState } from "react";
import TotalStaff from "../TotalStaff";
import {
  CircleCheckBig,
  MailWarning,
  UserRoundCog,
  Users,
} from "lucide-react";
import { useLanguage } from "@/app/_components/language-provider";
import {
  fetchAdminTotalsStats,
  formatDashboardCount,
  type AdminTotalsStats,
} from "@/lib/adminTotalsMetrics";
import { subscribeAdminCsvUploadSuccess } from "@/lib/adminCsvUploadRefresh";

export default function ScholTotals() {
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
    const unsub = subscribeAdminCsvUploadSuccess("schooling", load);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const schooling = stats?.schooling;

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
          label={isArabic ? "إجمالي طاقم التعليم" : "Total Schooling Staff"}
          icon={<Users strokeWidth={1.75} />}
          count={
            schooling ? formatDashboardCount(schooling.staff.total) : "—"
          }
        />
        <TotalStaff
          showMenu={false}
          label={isArabic ? "مبررات قيد المراجعة" : "Pending Justifications"}
          icon={<MailWarning strokeWidth={1.75} />}
          count={
            schooling
              ? formatDashboardCount(schooling.justifications.pending)
              : "—"
          }
          footer={
            <p className="flex flex-wrap items-center gap-1.5 text-[#707EAE] dark:text-[#9BA8C4]">
              <CircleCheckBig
                className="h-3.5 w-3.5 shrink-0 text-[#6CB4B4] sm:h-4 sm:w-4"
                strokeWidth={2}
              />
              <span className="font-semibold text-[#1B2559] dark:text-[#EEF4F7]">
                {schooling
                  ? formatDashboardCount(schooling.justifications.accepted)
                  : "—"}
              </span>
              <span>{isArabic ? "مقبولة" : "Accepted"}</span>
              <span className="font-semibold text-[#EE5D50]">
                {schooling
                  ? formatDashboardCount(schooling.justifications.refused)
                  : "—"}
              </span>
              <span>{isArabic ? "مرفوضة" : "Refused"}</span>
            </p>
          }
        />
        <TotalStaff
          showMenu={false}
          label={
            isArabic
              ? "طلبات غياب الأساتذة المعلقة"
              : "Pending Professor Absences"
          }
          icon={<UserRoundCog strokeWidth={1.75} />}
          count={
            schooling
              ? formatDashboardCount(schooling.teacher_absence_requests.pending)
              : "—"
          }
          footer={
            <p className="font-medium text-[#6CB4B4]">
              {isArabic
                ? "طلبات تنتظر مراجعة طاقم التعليم"
                : "Requests awaiting schooling review"}
            </p>
          }
        />
      </div>
    </section>
  );
}
