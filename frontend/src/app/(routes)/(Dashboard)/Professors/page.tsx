"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants";
import { getAccessToken } from "@/lib/tokenStorage";
import MiddleContainer from "@/app/_components/admin/professors/ProfMidContainer";
import ProfTotals from "@/app/_components/admin/professors/ProfTotals";
import BasicTable from "@/app/_components/admin/professors/ProfTable";
import PageFileStagingDropzone from "@/app/_components/PageFileStagingDropzone";

export default function Page() {
  const router = useRouter();
  const [stagedCsv, setStagedCsv] = useState<File | null>(null);

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) return;
    const token = getAccessToken();
    if (!token) {
      router.push("/Login");
    }
  }, [router]);

  return (
    <PageFileStagingDropzone
      accept={{
        "text/csv": [".csv"],
        "application/vnd.ms-excel": [".csv"],
      }}
      onFileStaged={(f) => setStagedCsv(f)}
      className="min-h-[calc(100dvh-10rem)] w-full min-w-0 max-w-full space-y-5"
    >
      <ProfTotals />
      <MiddleContainer stagedCsv={stagedCsv} onStagedCsvChange={setStagedCsv} />
      <BasicTable />
    </PageFileStagingDropzone>
  );
}