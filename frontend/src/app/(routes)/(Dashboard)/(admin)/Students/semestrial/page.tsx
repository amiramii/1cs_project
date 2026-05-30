"use client";

import { Suspense } from "react";
import SemestrialAttendancePage from "@/app/_components/sessions/SemestrialAttendancePage";
import { useLanguage } from "@/app/_components/language-provider";

function Fallback() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  return (
    <div className="flex min-h-[12rem] items-center justify-center text-sm text-muted-foreground">
      {isAr ? "جارٍ التحميل…" : "Loading…"}
    </div>
  );
}

export default function StudentSemestrialRoutePage() {
  return (
    <div className="mx-auto w-full space-y-4 xl:p-5">
      <Suspense fallback={<Fallback />}>
        <SemestrialAttendancePage />
      </Suspense>
    </div>
  );
}
