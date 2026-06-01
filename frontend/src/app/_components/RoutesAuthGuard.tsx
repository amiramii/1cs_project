"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import {
  ENABLE_AUTH_REDIRECTS,
  getDashboardHomePath,
} from "@/lib/constants"
import { isAuthRoute, isProtectedAppRoute } from "@/lib/authRoutes"
import {
  getCurrentAppRole,
  hasValidAccessToken,
} from "@/lib/tokenStorage"

/**
 * Top-level route guard for the `(routes)` group:
 * - Guest-only auth pages when already logged in
 * - Login redirect when accessing protected pages without a token
 */
export default function RoutesAuthGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [canRender, setCanRender] = useState(() => !ENABLE_AUTH_REDIRECTS)

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) {
      queueMicrotask(() => setCanRender(true))
      return
    }

    setCanRender(false)
    const path = pathname ?? "/"

    if (isAuthRoute(path) && hasValidAccessToken()) {
      const role = getCurrentAppRole("admin")
      router.replace(getDashboardHomePath(role))
      return
    }

    if (isProtectedAppRoute(path) && !hasValidAccessToken()) {
      router.replace("/Login")
      return
    }

    queueMicrotask(() => setCanRender(true))
  }, [pathname, router])

  if (!canRender) return null

  return <>{children}</>
}
