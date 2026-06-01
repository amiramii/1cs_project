"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  ENABLE_AUTH_REDIRECTS,
  DEFAULT_APP_ROLE,
  type AppSidebarRole,
} from "@/lib/constants"
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole"
import { useIsClient } from "@/lib/useIsClient"
import {
  getRoleViolationRedirectPath,
  isRouteAllowedForRole,
} from "@/lib/roleRouteAccess"
import { hasValidAccessToken } from "@/lib/tokenStorage"

export default function DashboardRoleGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const role = useEffectiveAppRole(
    DEFAULT_APP_ROLE as AppSidebarRole
  ) as AppSidebarRole
  const isClient = useIsClient()

  const needsLogin =
    ENABLE_AUTH_REDIRECTS && isClient && !hasValidAccessToken()
  const needsRoleRedirect =
    ENABLE_AUTH_REDIRECTS &&
    isClient &&
    hasValidAccessToken() &&
    !isRouteAllowedForRole(pathname, role)

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS || !isClient) return
    if (!hasValidAccessToken()) {
      router.replace("/Login")
      return
    }
    if (!isRouteAllowedForRole(pathname, role)) {
      const target = getRoleViolationRedirectPath(role)
      if (target !== pathname) {
        router.replace(target)
      }
    }
  }, [isClient, pathname, router, role])

  if (!ENABLE_AUTH_REDIRECTS) {
    return <>{children}</>
  }

  if (!isClient || needsLogin || needsRoleRedirect) {
    return null
  }

  return <>{children}</>
}
