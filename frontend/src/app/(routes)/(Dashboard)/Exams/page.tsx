"use client";

import { useLanguage } from "@/app/_components/language-provider";
import ProfessorExamsView from "@/app/_components/exams/ProfessorExamsView";
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole";

export default function Page() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const role = useEffectiveAppRole();

  if (role !== "prof") {
    return (
      <p className="text-sm text-muted-foreground">
        {isAr
          ? "صفحة الامتحانات متاحة للأساتذة فقط."
          : "The exams page is available to teachers only."}
      </p>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 space-y-4 xl:p-5">
      <ProfessorExamsView />
    </div>
  );
}
