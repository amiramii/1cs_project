"use client"

/**
 * `/Justifications` — schooling office, students, and admins (review queue).
 * The effective role picks which copy loads inside `JustificationsByRole`.
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import JustificationsByRole from "@/app/_components/role-pages/JustificationsByRole"
import type { JustificationsViewerRole } from "@/app/_components/role-pages/JustificationsByRole"
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants"
import { getAccessToken } from "@/lib/tokenStorage"
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole"

export default function Page() {
  const router = useRouter()
  const role = useEffectiveAppRole()

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) return
    const token = getAccessToken()
    if (!token) {
      router.push("/Login")
    }
  }, [router])

  const viewRole: JustificationsViewerRole =
    role === "student" ? "student" : role === "admin" ? "admin" : "schooling"

  return <JustificationsByRole role={viewRole} />
}
