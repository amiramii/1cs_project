"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/tokenStorage";
import MiddleContainer from "@/app/_components/admin/Rest/middleContainer";

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
   <MiddleContainer/>
  </>
  );
}