"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  ClipboardClock,
  GraduationCap,
  UserRoundPen,
} from "lucide-react";
import { useLanguage } from "@/app/_components/language-provider";
import NotificationPermissionPrompt from "@/app/_components/notifications/NotificationPermissionPrompt";
import { getSideBarItems, type Language } from "@/lib/constants";

function quickLinksExcludingDashboard(language: Language) {
  return getSideBarItems(language, "prof").filter((i) => i.href !== "/Dashboard");
}

export default function ProfessorDashboardView() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const links = quickLinksExcludingDashboard(language);

  return (
    <div className="w-full max-w-6xl space-y-8">
      <NotificationPermissionPrompt context="dashboard-home" />
      <header className="relative overflow-hidden rounded-2xl border border-[#74A7BD]/25 bg-gradient-to-br from-[#74A7BD]/10 via-[#FEF9F9] to-[#FEF9F9] p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -end-16 top-0 h-44 w-44 rounded-full bg-fuchsia-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -end-20 top-8 h-48 w-48 rounded-full bg-[#74A7BD]/12 blur-3xl" />
        <div className="pointer-events-none absolute end-8 bottom-0 h-32 w-32 rounded-full bg-sky-200/25 blur-2xl" />
        <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#51689A]">
          {isAr ? "أستاذ" : "Professor"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1B2065] md:text-3xl">
          {isAr ? "مساحة التدريس" : "Teaching workspace"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#51689A]">
          {isAr
            ? "ركّز على حصصك، طلابك، وجدولك دون عناصر إشراف عامة."
            : "Focus on your sessions, your students, and your schedule—without global admin tools."}
        </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: isAr ? "حصص اليوم" : "Sessions today",
            value: "6",
            icon: ClipboardClock,
          },
          {
            label: isAr ? "طلابك" : "Your students",
            value: "128",
            icon: GraduationCap,
          },
          {
            label: isAr ? "جداول نشطة" : "Active schedules",
            value: "14",
            icon: CalendarCheck2,
          },
          {
            label: isAr ? "قاعات مرتبطة" : "Rooms in use",
            value: "3",
            icon: UserRoundPen,
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
