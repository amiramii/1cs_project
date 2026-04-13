"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants";
import { getAccessToken } from "@/lib/tokenStorage";
import MiddleContainer from "@/app/_components/admin/students/StudMidContainer";
import StudTotals from "@/app/_components/admin/students/StudTotals";

export default function Page() {
  return (
    <div>
      <StudTotals/>
      <div className="flex justify-center p-4"><MiddleContainer/></div>
    </div>
  );
}