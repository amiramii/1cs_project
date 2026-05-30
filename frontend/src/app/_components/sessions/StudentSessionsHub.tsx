"use client";

import Link from "next/link";
import {
  CalendarPlus,
  CirclePlay,
  ClipboardClock,
  Info,
} from "lucide-react";

import { useLanguage } from "@/app/_components/language-provider";
import StudScheduleList from "@/app/_components/admin/schedules/StudScheduleList";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Student `/Sessions` hub — matches dashboard mockups: hero, upcoming card,
 * session history empty state, timetable PDFs, CTA to full schedules.
 */
export default function StudentSessionsHub() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="w-full max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-[#1B2065] md:text-3xl dark:text-[#EEF4F7]">
          {isAr ? "حصصك" : "Your Sessions"}
        </h1>
        <p className="text-[15px] text-[#51689A] dark:text-[#9BA8C4]">
          {isAr
            ? "تابع جدولك وحصصك المنشورة."
            : "Create sessions and manage attendance."}
        </p>
      </header>

      <Alert className="border-[#1B2065]/25 bg-[#1B2065]/10 dark:border-[#74A7BD]/25 dark:bg-[#152A38]">
        <Info aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <AlertTitle>{isAr ? "حصصي" : "My sessions"}</AlertTitle>
          <AlertDescription>
            {isAr
              ? "الجداول والحصص الخاصة بك كطالب."
              : "Your class sessions and timetable as a student."}
          </AlertDescription>
        </div>
      </Alert>

      <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#51689A]/50 bg-[#FEF9F9] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#383F58] dark:bg-[#1A2036]">
        <div className="min-w-0 space-y-1">
          <p className="font-bold text-[#1B2065] dark:text-[#EEF4F7]">
            {isAr
              ? "لديك حصة مجدولة اليوم (مثال)"
              : "You have a session scheduled today (sample)"}
          </p>
          <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
            Algebra - G2 — Jan 13, 2023 — 10:30 AM
          </p>
        </div>
        <Button
          type="button"
          className="h-12 shrink-0 rounded-full bg-[#1B2065] px-6 text-[#FEF9F9] hover:bg-[#1B2065]/90"
          asChild
        >
          <Link href="/Scheduals">
            <span className="inline-flex items-center gap-2">
              <ClipboardClock className="size-5" />
              {isAr ? "عرض الجدول" : "View schedule"}
            </span>
          </Link>
        </Button>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-[#1B2065] dark:text-[#EEF4F7]">
          {isAr ? "سجل الحصص" : "Session History"}
        </h2>
        <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
          {isAr ? "اطّلع على كل حصصك المحفوظة." : "Check all your saved sessions."}
        </p>
      </section>

      <div className="rounded-2xl border border-[#51689A]/25 bg-[#F6F7FE] p-10 text-center shadow-inner dark:border-[#383F58] dark:bg-[#1A2036]">
        <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-[#74A7BD]/20">
          <CirclePlay
            className="size-10 text-[#74A7BD]"
            strokeWidth={1.25}
          />
        </div>
        <h2 className="text-lg font-semibold text-[#51689A] dark:text-[#EEF4F7]">
          {isAr ? "لا يوجد سجل حصص" : "No Session History"}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#51689A] dark:text-[#9BA8C4]">
          {isAr
            ? "ستظهر حصصك المحفوظة هنا عند ربطها بالخادم."
            : "Start a new session to start tracking attendance. Save the session in order to check your session history."}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-14 w-full rounded-xl border-2 border-[#1B2065] bg-[#FEF9F9] text-base font-medium text-[#1B2065] hover:bg-[#74A7BD]/10 dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#EEF4F7] dark:hover:bg-[#383F58]"
        asChild
      >
        <Link href="/Scheduals">
          <CalendarPlus className="me-2 size-5" />
          {isAr ? "الجداول الكاملة" : "Open full schedules"}
        </Link>
      </Button>

      <StudScheduleList />
    </div>
  );
}
