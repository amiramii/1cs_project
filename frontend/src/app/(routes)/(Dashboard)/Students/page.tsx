"use client";

import StudentsByRole from "@/app/_components/role-pages/StudentsByRole";
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole";

export default function Page() {
  const role = useEffectiveAppRole();
  const studentsRole = role === "prof" ? "prof" : "admin";
  return <StudentsByRole role={studentsRole} />;
}
