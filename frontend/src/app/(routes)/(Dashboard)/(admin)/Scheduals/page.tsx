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

export default function Page() {
  const router = useRouter();
  const appRole = useEffectiveAppRole("admin");
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
      <div className="mx-auto w-full max-w-6xl flex-1 pb-6 pt-2 sm:pt-4">
        <ProfScheduleList variant="prof-tab" />
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
