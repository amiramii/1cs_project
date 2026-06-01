import type { AppSidebarRole } from "./constants"

/**
 * Returns true when `pathname` (from `usePathname()`) may be shown for this role.
 * Paths are matched case-sensitively to match Next.js routing.
 */
export function isRouteAllowedForRole(pathname: string, role: AppSidebarRole): boolean {
  const path = (pathname.split("?")[0] ?? "/").replace(/\/$/, "") || "/"
  const p = path === "" ? "/" : path

  if (role === "admin") {
    return (
      p === "/Dashboard" ||
      p.startsWith("/Dashboard/") ||
      p === "/Professors" ||
      p.startsWith("/Professors/") ||
      p === "/Students" ||
      p.startsWith("/Students/") ||
      p === "/Scheduals" ||
      p.startsWith("/Scheduals/") ||
      p === "/Sessions" ||
      p.startsWith("/Sessions/") ||
      p === "/Justifications" ||
      p.startsWith("/Justifications/")
    )
  }

  if (role === "schooling") {
    return (
      p === "/Dashboard" ||
      p.startsWith("/Dashboard/") ||
      p === "/Justifications" ||
      p === "/Justifications/Schooling-Justifications" ||
      p.startsWith("/Justifications/Schooling-Justifications/") ||
      p === "/Justifications/Justification-details" ||
      p.startsWith("/Justifications/Justification-details/") ||
      p === "/ProfAuditions/Absences" ||
      p.startsWith("/ProfAuditions/Absences/") ||
      p === "/ProfAuditions/Requests" ||
      p.startsWith("/ProfAuditions/Requests/")
    )
  }

  if (role === "prof") {
    if (
      p === "/Professors" ||
      p.startsWith("/Professors/") ||
      p === "/Scheduals/Student-Schedules" ||
      p.startsWith("/Scheduals/Student-Schedules/") ||
      p === "/Justifications" ||
      p.startsWith("/Justifications/")
    ) {
      return false
    }
    return (
      p === "/Dashboard" ||
      p.startsWith("/Dashboard/") ||
      p === "/Students" ||
      p.startsWith("/Students/") ||
      p === "/Scheduals" ||
      p.startsWith("/Scheduals/") ||
      p === "/Sessions" ||
      p.startsWith("/Sessions/") ||
      p === "/Absences" ||
      p.startsWith("/Absences/")
    )
  }

  // student
  if (
    p === "/Professors" ||
    p.startsWith("/Professors/") ||
    p === "/Students" ||
    p.startsWith("/Students/") ||
    p === "/Scheduals/Professor-Schedules" ||
    p.startsWith("/Scheduals/Professor-Schedules/") ||
    p === "/Justifications/Student-Justifications" ||
    p.startsWith("/Justifications/Student-Justifications/")
  ) {
    return false
  }

  return (
    p === "/Dashboard" ||
    p.startsWith("/Dashboard/") ||
    p === "/Scheduals" ||
    p.startsWith("/Scheduals/") ||
    p === "/Justifications" ||
    p.startsWith("/Justifications/") ||
    p === "/Absences" ||
    p.startsWith("/Absences/")
  )
}

/** Where to send the user if they open a route their role cannot access. */
export function getRoleViolationRedirectPath(_role: AppSidebarRole): string {
  return "/Dashboard"
}
