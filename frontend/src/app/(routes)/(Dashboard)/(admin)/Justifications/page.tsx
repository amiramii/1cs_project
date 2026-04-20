"use client"

/**
 * `/Justifications` — schooling office and students (admins use other tools; no admin tab).
 * The effective role picks which copy loads inside `JustificationsByRole`.
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import JustificationsByRole from "@/app/_components/role-pages/JustificationsByRole"
import { ENABLE_AUTH_REDIRECTS } from "@/lib/constants"
import { getAccessToken } from "@/lib/tokenStorage"
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole"

export default function Page() {
  const router = useRouter()
  const role = useEffectiveAppRole("admin")

  useEffect(() => {
    if (role === "admin") {
      router.replace("/Dashboard")
    }
  }, [role, router])

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) return
    const token = getAccessToken()
    if (!token) {
      router.push("/Login")
    }
  }, [router])

  if (role === "admin") {
    return null
  }

  const viewRole = role === "student" ? "student" : "schooling"
  return <JustificationsByRole role={viewRole} />
}
