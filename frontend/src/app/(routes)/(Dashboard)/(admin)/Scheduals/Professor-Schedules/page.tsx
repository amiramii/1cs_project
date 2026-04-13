"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants";
import { getAccessToken } from "@/lib/tokenStorage";
import PdfPreview from "@/app/_components/admin/schedules/PdfPreview";
import ScheduleList from "@/app/_components/admin/schedules/ProfScheduleList";
import PdfGrid from "@/app/_components/admin/schedules/PdfGrid";
export default function Page() {
  return (
  <>
    <ScheduleList/>
    {/* <PdfGrid link="http://127.0.0.1:8000/api/documents/?audience=teacher"/> */}
  </>
  );
}