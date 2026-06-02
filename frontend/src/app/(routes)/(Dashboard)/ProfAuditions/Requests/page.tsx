"use client"

/**
 * Alias route — matches `/Justifications` role routing for bookmarks / sidebar variants.
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import ProfSessions from "@/app/_components/sessions/SchoolingSessionReq"
import type { JustificationsViewerRole } from "@/app/_components/absences/ProfAbsence"
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
    role === "schooling" ? "schooling" : "professor"

  return <ProfSessions role={viewRole} />
}
