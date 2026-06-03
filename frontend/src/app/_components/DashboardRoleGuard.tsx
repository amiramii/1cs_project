"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import RouteLoadingShell from "@/app/_components/RouteLoadingShell"
import {
  ENABLE_AUTH_REDIRECTS,
  type AppSidebarRole,
} from "@/lib/constants"
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole"
import { useIsClient } from "@/lib/useIsClient"
import { ensureAppRoleResolved } from "@/lib/resolveAppRole"
import {
  getRoleViolationRedirectPath,
  isRouteAllowedForRole,
} from "@/lib/roleRouteAccess"
import {
  clearTokens,
  hasValidAccessToken,
} from "@/lib/tokenStorage"

export default function DashboardRoleGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const role = useEffectiveAppRole() as AppSidebarRole | null
  const isClient = useIsClient()
  const [roleReady, setRoleReady] = useState(false)

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS || !isClient) return

    if (!hasValidAccessToken()) {
      queueMicrotask(() => {
        setRoleReady(true)
        router.replace("/Login")
      })
      return
    }

    let cancelled = false
    void ensureAppRoleResolved().then((resolved) => {
      if (cancelled) return
      setRoleReady(true)
      if (!resolved) {
        clearTokens()
        router.replace("/Login")
      }
    })

    return () => {
      cancelled = true
    }
  }, [isClient, router])

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS || !isClient || !roleReady || !role) return
    if (!hasValidAccessToken()) return

    if (!isRouteAllowedForRole(pathname, role)) {
      const target = getRoleViolationRedirectPath(role)
      if (target !== pathname) {
        router.replace(target)
      }
    }
  }, [isClient, pathname, router, role, roleReady])

  const needsLogin =
    ENABLE_AUTH_REDIRECTS && isClient && roleReady && !hasValidAccessToken()
  const needsRoleResolution =
    ENABLE_AUTH_REDIRECTS &&
    isClient &&
    hasValidAccessToken() &&
    (!roleReady || !role)
  const needsRoleRedirect =
    ENABLE_AUTH_REDIRECTS &&
    isClient &&
    roleReady &&
    hasValidAccessToken() &&
    role != null &&
    !isRouteAllowedForRole(pathname, role)

  if (!ENABLE_AUTH_REDIRECTS) {
    return <>{children}</>
  }

  if (!isClient || needsLogin || needsRoleResolution || needsRoleRedirect) {
    return <RouteLoadingShell />
  }

  return <>{children}</>
}
