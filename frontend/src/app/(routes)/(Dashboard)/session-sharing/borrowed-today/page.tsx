"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Notification deep link when a share request is accepted. */
export default function SessionSharingBorrowedTodayPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/Sessions");
  }, [router]);

  return null;
}
