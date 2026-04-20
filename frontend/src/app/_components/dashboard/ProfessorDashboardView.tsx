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
      <header className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-card p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -end-20 top-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          {isAr ? "أستاذ" : "Professor"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {isAr ? "مساحة التدريس" : "Teaching workspace"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {isAr
            ? "ركّز على حصصك، طلابك، وجدولك دون عناصر إشراف عامة."
            : "Focus on your sessions, your students, and your schedule—without global admin tools."}
        </p>
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
            className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-emerald-500/25 hover:bg-emerald-500/5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="pt-2 text-2xl font-semibold tabular-nums text-foreground">
              {card.value}
            </p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          {isAr ? "انتقل إلى" : "Go to"}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/5"
              >
                <span>{item.label}</span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
