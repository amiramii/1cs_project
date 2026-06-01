"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  ENABLE_AUTH_REDIRECTS,
  DEFAULT_APP_ROLE,
  type AppSidebarRole,
} from "@/lib/constants"
import { useEffectiveAppRole } from "@/lib/useEffectiveAppRole"
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
  const [canRender, setCanRender] = useState(() => !ENABLE_AUTH_REDIRECTS)

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) {
      queueMicrotask(() => setCanRender(true))
      return
    }

    setCanRender(false)

    if (!hasValidAccessToken()) {
      router.replace("/Login")
      return
    }

    if (!isRouteAllowedForRole(pathname, role)) {
      const target = getRoleViolationRedirectPath(role)
      if (target !== pathname) {
        router.replace(target)
      }
      return
    }

    queueMicrotask(() => setCanRender(true))
  }, [pathname, router, role])

  if (!canRender) return null

  return <>{children}</>
}
