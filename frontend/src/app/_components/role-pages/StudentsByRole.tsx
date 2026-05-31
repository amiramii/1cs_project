"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MiddleContainer from "@/app/_components/admin/students/StudMidContainer";
import StudTotals from "@/app/_components/admin/students/StudTotals";
import StudTable from "@/app/_components/admin/students/StudTable";
import ProfStudentsRoster from "@/app/_components/admin/students/ProfStudentsRoster";
import PageFileStagingDropzone from "@/app/_components/PageFileStagingDropzone";
import { useLanguage } from "@/app/_components/language-provider";
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants";
import { getAccessToken } from "@/lib/tokenStorage";

export default function StudentsByRole({
  role,
}: {
  role: "admin" | "prof";
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const router = useRouter();
  const [stagedCsv, setStagedCsv] = useState<File | null>(null);

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) return;
    const token = getAccessToken();
    if (!token) {
      router.push("/Login");
    }
  }, [router]);

  if (role === "admin") {
    return (
      <PageFileStagingDropzone
        accept={{
          "text/csv": [".csv"],
          "application/vnd.ms-excel": [".csv"],
        }}
        onFileStaged={(f) => setStagedCsv(f)}
        className="min-h-[calc(100dvh-10rem)] w-full min-w-0 max-w-full space-y-5"
      >
        <StudTotals />
        <MiddleContainer stagedCsv={stagedCsv} onStagedCsvChange={setStagedCsv} />
        <StudTable />
      </PageFileStagingDropzone>
    );
  }

  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-5">
      <header className="rounded-xl border border-[#51689A]/20 bg-[#51689A]/5 p-5 shadow-sm dark:border-[#383F58] dark:bg-[#1A2036]/80">
        <h1 className="text-xl font-semibold text-foreground dark:text-[#EEF4F7]">
          {isAr ? "طلابي" : "My students"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground dark:text-[#9BA8C4]">
          {isAr
            ? "كل الطلاب المسجّلين في شعبك."
            : "Everyone enrolled in your classes."}
        </p>
      </header>
      <ProfStudentsRoster />
    </div>
  );
}
