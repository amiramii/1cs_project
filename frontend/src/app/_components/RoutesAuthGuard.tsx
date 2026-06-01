"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import {
  ENABLE_AUTH_REDIRECTS,
  getDashboardHomePath,
} from "@/lib/constants"
import { isAuthRoute, isProtectedAppRoute } from "@/lib/authRoutes"
import { useIsClient } from "@/lib/useIsClient"
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
  const isClient = useIsClient()

  const path = pathname ?? "/"
  const redirectToDashboard =
    ENABLE_AUTH_REDIRECTS &&
    isClient &&
    isAuthRoute(path) &&
    hasValidAccessToken()
  const redirectToLogin =
    ENABLE_AUTH_REDIRECTS &&
    isClient &&
    isProtectedAppRoute(path) &&
    !hasValidAccessToken()

  useEffect(() => {
    if (redirectToDashboard) {
      const role = getCurrentAppRole("admin")
      router.replace(getDashboardHomePath(role))
    } else if (redirectToLogin) {
      router.replace("/Login")
    }
  }, [redirectToDashboard, redirectToLogin, router])

  if (!ENABLE_AUTH_REDIRECTS) {
    return <>{children}</>
  }

  if (!isClient || redirectToDashboard || redirectToLogin) {
    return null
  }

  return <>{children}</>
}
