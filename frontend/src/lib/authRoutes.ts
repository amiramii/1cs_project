/** Auth-only paths: logged-in users are redirected to the dashboard. */
const AUTH_ROUTE_PREFIXES = [
  "/Login",
  "/Forgot-password",
  "/reset-password",
] as const

export function normalizeRoutePath(pathname: string): string {
  const path = (pathname.split("?")[0] ?? "/").replace(/\/$/, "") || "/"
  return path === "" ? "/" : path
}

export function isAuthRoute(pathname: string): boolean {
  const p = normalizeRoutePath(pathname)
  return AUTH_ROUTE_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`)
  )
}

/** App pages that require a valid access token (dashboard and nested routes). */
export function isProtectedAppRoute(pathname: string): boolean {
  const p = normalizeRoutePath(pathname)
  if (isAuthRoute(p)) return false
  if (p === "/") return false
  return true
}
