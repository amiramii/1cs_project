import type { AppSidebarRole } from "./constants"
import { getSideBarItems } from "./constants"

/** Normalize `usePathname()` for stable prefix checks. */
function normalizePathname(pathname: string): string {
  const path = (pathname.split("?")[0] ?? "/").replace(/\/$/, "") || "/"
  return path === "" ? "/" : path
}

function matchesHref(path: string, href: string): boolean {
  return path === href || path.startsWith(`${href}/`)
}

/** Routes reachable from the sidebar but not listed as top-level hrefs. */
const EXTRA_ROUTE_PREFIXES: Record<AppSidebarRole, string[]> = {
  admin: ["/Sessions"],
  prof: [],
  student: [],
  schooling: [],
}

/** Paths that must stay blocked even if they share a prefix with an allowed href. */
const DENIED_ROUTE_PREFIXES: Record<AppSidebarRole, string[]> = {
  admin: ["/Absences"],
  prof: [
    "/Professors",
    "/Scheduals/Student-Schedules",
    "/Justifications",
    "/Schooling",
  ],
  student: [
    "/Professors",
    "/Students",
    "/Scheduals/Professor-Schedules",
    "/Sessions",
    "/Schooling",
    "/ProfAuditions",
  ],
  schooling: [
    "/Professors",
    "/Students",
    "/Sessions",
    "/Scheduals",
    "/Schooling",
    "/Absences",
  ],
}

/**
 * Returns true when `pathname` (from `usePathname()`) may be shown for this role.
 * Allowed routes = sidebar hrefs for the role + nested paths under those hrefs.
 */
export function isRouteAllowedForRole(pathname: string, role: AppSidebarRole): boolean {
  const p = normalizePathname(pathname)

  for (const denied of DENIED_ROUTE_PREFIXES[role]) {
    if (matchesHref(p, denied)) return false
  }

  const allowedPrefixes = [
    ...getSideBarItems("en", role).map((item) => item.href),
    ...EXTRA_ROUTE_PREFIXES[role],
  ]

  return allowedPrefixes.some((href) => matchesHref(p, href))
}

/** Where to send the user if they open a route their role cannot access. */
export function getRoleViolationRedirectPath(_role: AppSidebarRole): string {
  return "/Dashboard"
}
