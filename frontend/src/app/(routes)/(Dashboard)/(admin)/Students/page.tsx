"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import StudentsByRole from "@/app/_components/role-pages/StudentsByRole";
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole";

export default function Page() {
  const router = useRouter();
  const role = useEffectiveAppRole("admin");

  useEffect(() => {
    if (role === "schooling") {
      router.replace("/Dashboard");
    }
  }, [role, router]);

  if (role === "schooling") {
    return null;
  }

  const studentsRole = role === "prof" ? "prof" : "admin";
  return <StudentsByRole role={studentsRole} />;
}
