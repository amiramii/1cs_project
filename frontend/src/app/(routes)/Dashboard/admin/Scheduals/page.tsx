"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/tokenStorage";
import SchedulsMiddleContainer from "@/app/_components/admin/Rest/SchedulsMiddleContainer";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/Login");
    }
  }, [router]);

  return (
  <>
  <SchedulsMiddleContainer/>
  </>
  );
}