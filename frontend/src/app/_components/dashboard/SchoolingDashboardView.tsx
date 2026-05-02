"use client";

import {
  CalendarCheck2,
  ClipboardClock,
  GraduationCap,
  UserRoundPen,
} from "lucide-react";
import { useLanguage } from "@/app/_components/language-provider";
import NotificationPermissionPrompt from "@/app/_components/notifications/NotificationPermissionPrompt";

export default function SchoolingDashboardView() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const statCards = [
    {
      id: "professors" as const,
      label: isAr ? "الأساتذة" : "Professors",
      value: "1,900",
      icon: UserRoundPen,
    },
    {
      id: "students" as const,
      label: isAr ? "الطلاب" : "Students",
      value: "8,450",
      icon: GraduationCap,
    },
    {
      id: "schedules" as const,
      label: isAr ? "الجداول" : "Schedules",
      value: "326",
      icon: CalendarCheck2,
    },
    {
      id: "sessions" as const,
      label: isAr ? "الحصص اليوم" : "Sessions today",
      value: "42",
      icon: ClipboardClock,
    },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-8">
      <NotificationPermissionPrompt context="dashboard-home" />
      <header
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm md:p-8"
      >
        <div className="pointer-events-none absolute -end-16 -top-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {isAr ? "مسؤول المنصة" : "Schooling admin"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {isAr ? "لوحة الإشراف" : "Schooling control center"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {isAr
            ? "إدارة الأساتذة والطلاب والجداول والحصص من مكان واحد."
            : "Manage professors, students, schedules, and sessions from one place."}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article
            key={card.id}
            className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/25 hover:bg-accent/30"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon size={18} className="shrink-0 text-primary" />
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
