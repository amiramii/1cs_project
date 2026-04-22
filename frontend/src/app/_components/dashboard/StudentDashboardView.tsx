"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  ClipboardClock,
  GraduationCap,
  FileWarning,
} from "lucide-react";
import { useLanguage } from "@/app/_components/language-provider";
import NotificationPermissionPrompt from "@/app/_components/notifications/NotificationPermissionPrompt";
import { Button } from "@/components/ui/button";

export default function StudentDashboardView() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="w-full max-w-6xl space-y-8">
      <NotificationPermissionPrompt context="dashboard-home" />
      <header className="relative overflow-hidden rounded-2xl border border-[#1B2065]/20 bg-gradient-to-br from-[#1B2065]/10 via-[#FEF9F9] to-[#FEF9F9] p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -start-10 -bottom-16 h-44 w-44 rounded-full bg-[#74A7BD]/15 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-wide text-[#51689A]">
          {isAr ? "طالب" : "Student"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1B2065] md:text-3xl">
          {isAr ? "مساحتك الدراسية" : "Your student hub"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#51689A]">
          {isAr
            ? "تابع حضورك، حصصك، ومبررات الغياب—بدون صلاحيات الإدارة أو الأساتذة الآخرين."
            : "Track attendance, your sessions, and justifications—no admin or other teachers’ tools here."}
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#1B2065]">
              {isAr ? "حصصك" : "Your Sessions"}
            </h2>
            <p className="text-sm text-[#51689A]">
              {isAr
                ? "أنشئ الحصص وتتبع الحضور (ملخص)."
                : "Create sessions and manage attendance — overview."}
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-[#51689A] text-[#1B2065] hover:bg-[#74A7BD]/15" asChild>
            <Link href="/Sessions" className="inline-flex items-center gap-1">
              {isAr ? "كل الحصص" : "All sessions"}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: isAr ? "حاضر" : "Present",
              value: "70%",
              color: "#74A7BD",
            },
            {
              label: isAr ? "غائب" : "Absent",
              value: "20%",
              color: "#C71122",
            },
            {
              label: isAr ? "مبرر" : "Justified",
              value: "10%",
              color: "#E7CE51",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[#51689A]/25 bg-[#FEF9F9] px-4 py-4 text-center shadow-sm"
            >
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: s.color }}
              >
                {s.value}
              </p>
              <p className="text-sm font-medium text-[#51689A]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#51689A]">
          {isAr
            ? "أرقام توضيحية؛ تُستبدل ببياناتك عند الربط."
            : "Illustrative rates; replaced by your data when the API is connected."}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: isAr ? "حصص هذا الأسبوع" : "Sessions this week",
            value: "18",
            icon: ClipboardClock,
          },
          {
            label: isAr ? "نسبة الحضور" : "Attendance rate",
            value: "92%",
            icon: GraduationCap,
          },
          {
            label: isAr ? "مبررات قيد المراجعة" : "Justifications pending",
            value: "2",
            icon: FileWarning,
          },
          {
            label: isAr ? "جداول مسجّلة" : "Schedules on file",
            value: "5",
            icon: CalendarCheck2,
          },
        ].map((card) => (
          <article
            key={card.label}
            className="rounded-xl border border-[#51689A]/20 bg-[#FEF9F9] p-4 shadow-sm transition-colors hover:border-[#74A7BD]/35 hover:bg-[#F6F7FE]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-[#51689A]">{card.label}</p>
              <card.icon size={18} className="shrink-0 text-[#74A7BD]" />
            </div>
            <p className="pt-2 text-2xl font-semibold tabular-nums text-[#1B2065]">
              {card.value}
            </p>
          </article>
        ))}
      </section>

      
    </div>
  );
}
