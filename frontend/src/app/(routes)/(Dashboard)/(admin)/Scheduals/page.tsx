"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants";
import { getAccessToken } from "@/lib/tokenStorage";
import SchedulsMiddleContainer from "@/app/_components/admin/schedules/SchedMidContainer";
import ScheduleList from "@/app/_components/admin/schedules/ScheduleList";
import PdfView from "@/app/_components/admin/schedules/PdfView";
export default function Page() {
  const router = useRouter();

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) return;
    const token = getAccessToken();
    if (!token) {
      router.push("/Login");
    }
  }, [router]);

  return (
  <>
  <SchedulsMiddleContainer/>
  <ScheduleList/>
  <PdfView/>
  </>
  );
}