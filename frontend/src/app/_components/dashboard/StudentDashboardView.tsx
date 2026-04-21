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
import { getSideBarItems, type Language } from "@/lib/constants";

function quickLinksExcludingDashboard(language: Language) {
  return getSideBarItems(language, "student").filter((i) => i.href !== "/Dashboard");
}

export default function StudentDashboardView() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const links = quickLinksExcludingDashboard(language);

  return (
    <div className="w-full max-w-6xl space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-card to-card p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -start-10 -bottom-16 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
          {isAr ? "طالب" : "Student"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {isAr ? "مساحتك الدراسية" : "Your student hub"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {isAr
            ? "تابع حضورك، حصصك، ومبررات الغياب—بدون صلاحيات الإدارة أو الأساتذة الآخرين."
            : "Track attendance, your sessions, and justifications—no admin or other teachers’ tools here."}
        </p>
      </header>

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
            className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-violet-500/25 hover:bg-violet-500/5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon size={18} className="shrink-0 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="pt-2 text-2xl font-semibold tabular-nums text-foreground">
              {card.value}
            </p>
          </article>
        ))}
      </section>

      
    </div>
  );
}
