"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants";
import { getAccessToken } from "@/lib/tokenStorage";
import ScheduleList from "@/app/_components/admin/schedules/StudScheduleList";
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
    <div className="flex w-full min-w-0 max-w-none flex-1 flex-col self-stretch min-h-0 ">
      <ScheduleList />
    </div>
  );
}