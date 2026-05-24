"use client"

import { useEffect } from "react"
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

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) return
    if (isRouteAllowedForRole(pathname, role)) return
    const target = getRoleViolationRedirectPath(role)
    if (target !== pathname) {
      router.replace(target)
    }
  }, [pathname, router, role])

  return <>{children}</>
}
