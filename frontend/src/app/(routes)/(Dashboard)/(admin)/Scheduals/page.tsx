"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants";
import { getAccessToken } from "@/lib/tokenStorage";
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole";
import SchedulsMiddleContainer from "@/app/_components/admin/schedules/SchedMidContainer";
import type { SchedualsVariant } from "@/app/_components/admin/schedules/SchedMidContainer";
import PageFileStagingDropzone from "@/app/_components/PageFileStagingDropzone";
import ProfScheduleList from "@/app/_components/admin/schedules/ProfScheduleList";
import { useLanguage } from "@/app/_components/language-provider";

export default function Page() {
  const router = useRouter();
  const appRole = useEffectiveAppRole("admin");
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [stagedPdf, setStagedPdf] = useState<File | null>(null);

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) return;
    const token = getAccessToken();
    if (!token) {
      router.push("/Login");
    }
  }, [router]);

  const variant: SchedualsVariant =
    appRole === "student" ? "student" : "admin";

  if (variant === "student") {
    return (
      <div className="w-full space-y-5">
        <SchedulsMiddleContainer variant={variant} />
      </div>
    );
  }

  if (appRole === "prof") {
    return (
      <div className="mx-auto w-full max-w-6xl flex-col space-y-6">
        <header className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">
            {isAr ? "الجداول" : "Schedules"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isAr
              ? "عرض جداول PDF التي ينشرها المسؤول فقط. الأستاذ لا يرفع ملفات هنا."
              : "View PDF timetables published by an administrator. Professors do not upload files here."}
          </p>
        </header>
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">
            {isAr ? "جداول PDF المنشورة" : "Published timetable PDFs"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "قائمة الملفات المتاحة لجمهور الأساتذة."
              : "Files available to the professor audience."}
          </p>
          <ProfScheduleList />
        </section>
      </div>
    );
  }

  return (
    <PageFileStagingDropzone
      accept={{
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "application/vnd.ms-excel": [".xls"],
        "text/csv": [".csv"],
      }}
      onFileStaged={(f) => setStagedPdf(f)}
      className="min-h-[calc(100dvh-10rem)] w-full space-y-5"
    >
      <SchedulsMiddleContainer
        variant={variant}
        stagedPdf={stagedPdf}
        onStagedPdfChange={setStagedPdf}
      />
    </PageFileStagingDropzone>
  );
}
