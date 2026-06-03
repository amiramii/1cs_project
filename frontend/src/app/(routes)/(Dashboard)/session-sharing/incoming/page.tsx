"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Notification deep link from backend: `/session-sharing/incoming/` */
export default function SessionSharingIncomingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/Sessions?shareIncoming=1");
  }, [router]);

  return null;
}
