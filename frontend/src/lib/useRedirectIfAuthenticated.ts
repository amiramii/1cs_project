"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ENABLE_AUTH_REDIRECTS, getDashboardHomePath } from "./constants"
import { getCurrentAppRole, hasValidAccessToken } from "./tokenStorage"

export function useRedirectIfAuthenticated(redirectTo?: string) {
  const router = useRouter()
  const [ready, setReady] = useState(() => !ENABLE_AUTH_REDIRECTS)

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) return
    setReady(false)
    if (hasValidAccessToken()) {
      const role = getCurrentAppRole("admin")
      router.replace(redirectTo ?? getDashboardHomePath(role))
      return
    }
    queueMicrotask(() => setReady(true))
  }, [redirectTo, router])

  return ready
}
