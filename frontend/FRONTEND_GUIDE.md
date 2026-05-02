# Frontend project guide (for collaborators)

This document explains **what every source file does** and how pieces fit together.  
We use **one guide + focused comments in tricky code** instead of commenting every line (which would duplicate the code and go stale quickly).

---

## Stack

| Piece | Role |
|--------|------|
| **Next.js 16** (App Router) | Routes in `src/app`, layouts, server/client components |
| **React 19** | UI and state |
| **TypeScript** | Types across the app |
| **Tailwind CSS** | Utility styling (`globals.css`, `className`) |
| **shadcn/ui** (Radix under the hood) | `src/components/ui/*` — buttons, dialogs, selects, etc. |
| **lucide-react** | Icons |
| **next-themes** | Dark/light via `theme-provider` |
| **JWT in storage** | Access/refresh tokens + app role — see `lib/tokenStorage.ts` |

---

## Root layout & entry

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | HTML shell, fonts, global CSS, wraps everything in `Providers` |
| `src/app/page.tsx` | Landing / redirect entry for `/` |
| `src/app/loading.tsx` | Global loading UI while route segments load |
| `src/app/globals.css` | Tailwind layers + CSS variables (theme colors, radius) |

---

## Providers & cross-cutting UI

| File | Purpose |
|------|---------|
| `src/app/_components/providers.tsx` | Composes theme + language + direction providers for the tree |
| `src/app/_components/theme-provider.tsx` | Wraps `next-themes` `ThemeProvider` |
| `src/app/_components/language-provider.tsx` | React context: `language`, `setLanguage`, `dir` (LTR/RTL) |
| `src/app/_components/language-selector.tsx` | Small UI to pick EN/AR (if used on auth pages) |
| `src/app/_components/DashboardRoleGuard.tsx` | Client guard: redirects if route not allowed for current role |
| `src/app/_components/DevRoleSwitcher.tsx` | **Dev only**: floating panel to preview UI as another role (draggable); does not change API identity |

---

## Dashboard shell

| File | Purpose |
|------|---------|
| `src/app/(routes)/(Dashboard)/layout.tsx` | Sidebar (or top nav for schooling), header (language, theme, user menu), `main` + `DashboardRoleGuard` |
| `src/app/_components/SideBarItems.tsx` | Renders nav links from `getSideBarItems` for current role |
| `src/components/ui/siderbar.tsx` | Collapsible sidebar + logo + `SideBarItems` + minimize control |
| `src/components/ui/sidebarMenuIcon.tsx` | Maps icon ids to Lucide icons for sidebar labels |

---

## Routes (pages) 

| File | Purpose |
|------|---------|
| `src/app/(routes)/Login/page.tsx` | Login screen |
| `src/app/(routes)/Forgot-password/page.tsx` | Request password reset email |
| `src/app/(routes)/reset-password/[uidb64]/[token]/page.tsx` | Set new password from email link |
| `src/app/(routes)/(Dashboard)/(admin)/Dashboard/page.tsx` | Role-specific dashboard home |
| `src/app/(routes)/(Dashboard)/(admin)/Justifications/page.tsx` | Justifications route; picks student vs admin vs schooling |
| `src/app/(routes)/(Dashboard)/(admin)/Sessions/page.tsx` | Admin schedule links OR prof sessions OR student timetable |
| `src/app/(routes)/(Dashboard)/(admin)/Scheduals/page.tsx` | Schedule upload hub (admin) |
| `src/app/(routes)/(Dashboard)/(admin)/Scheduals/Professor-Schedules/page.tsx` | Professor PDF list layout |
| `src/app/(routes)/(Dashboard)/(admin)/Scheduals/Student-Schedules/page.tsx` | Student PDF list layout |
| `src/app/(routes)/(Dashboard)/(admin)/Professors/page.tsx` | Professors admin |
| `src/app/(routes)/(Dashboard)/(admin)/Students/page.tsx` | Students admin |

---

## Feature: login & auth UI

| File | Purpose |
|------|---------|
| `src/app/_components/login/LoginForm.tsx` | Form: email/password, remember-me, submit → `login` API |
| `src/app/_components/login/EmailInput.tsx` | Email field wrapper |
| `src/app/_components/login/PasswordInput.tsx` | Password field wrapper |
| `src/app/_components/login/SubmitButton.tsx` | Submit control (often uses shared button styles) |
| `src/app/_components/login/AnimatedFormButton.tsx` | Branded animated primary/outline buttons (uses shadcn `Button`) |
| `src/app/_components/login/LanguageMenu.tsx` | Header language dropdown (EN/AR) |
| `src/app/_components/login/AuthPageBackground.tsx` | Decorative background for auth pages |
| `src/app/_components/login/CirclesBg.tsx` | Extra decorative circles |

---

## Feature: dashboards by role

| File | Purpose |
|------|---------|
| `src/app/_components/dashboard/AdminDashboardView.tsx` | Admin home tiles / copy |
| `src/app/_components/dashboard/ProfessorDashboardView.tsx` | Professor home |
| `src/app/_components/dashboard/StudentDashboardView.tsx` | Student home |

---

## Feature: justifications

| File | Purpose |
|------|---------|
| `src/app/_components/role-pages/JustificationsByRole.tsx` | Admin / student / schooling copy + alerts + notification prompt |
| `src/app/_components/notifications/NotificationPermissionPrompt.tsx` | Web Notifications permission UI (Bell + `Alert`) |

---

## Feature: students (admin)

| File | Purpose |
|------|---------|
| `src/app/_components/role-pages/StudentsByRole.tsx` | Student-facing vs admin copy for Students page |
| `src/app/_components/admin/students/StudMidContainer.tsx` | Upload/import UI for student CSV etc. |
| `src/app/_components/admin/students/StudTotals.tsx` | Summary counts widget |

---

## Feature: professors (admin)

| File | Purpose |
|------|---------|
| `src/app/_components/admin/professors/ProfMidContainer.tsx` | Middle section: dropzone + navigation to lists |
| `src/app/_components/admin/professors/ProfTable.tsx` | Table, filters, sheet editor, pagination (mock data wired for UI) |
| `src/app/_components/admin/professors/ProfTotals.tsx` | Totals strip |

---

## Feature: schedules / PDFs

| File | Purpose |
|------|---------|
| `src/app/_components/admin/schedules/SchedMidContainer.tsx` | Upload schedule PDF (audience, year, title) + links to lists |
| `src/app/_components/admin/schedules/ScheduleListShell.tsx` | Fetches `/api/documents/`, search, grade filter, grid of `PdfPreview` |
| `src/app/_components/admin/schedules/StudScheduleList.tsx` | Thin wrapper: student audience + single layout |
| `src/app/_components/admin/schedules/ProfScheduleList.tsx` | Professor list variant |
| `src/app/_components/admin/schedules/PdfPreview.tsx` | Card thumbnail → dialog with PDF/spreadsheet viewer + download |
| `src/app/_components/admin/schedules/PdfGrid.tsx` | Grid helper if used |
| `src/app/_components/admin/schedules/PdfView.tsx` | Demo multi-PDF navigator (sample URLs) |

---

## Feature: sessions (professor)

| File | Purpose |
|------|---------|
| `src/app/_components/sessions/ProfessorSessionsView.tsx` | Lists sessions, attendance sheet, save, CSV export, create session |
| `src/app/_components/sessions/profSessionMock.ts` | Dev-only mock session id + builder when backend empty |

---

## Shared admin bits

| File | Purpose |
|------|---------|
| `src/app/_components/admin/SearchBar.tsx` | Search input with icon (shadcn `Input`) |
| `src/app/_components/admin/TableHeader.tsx` | Legacy schedule header + filter (Card + Select) |
| `src/app/_components/admin/AddButton.tsx` | Reusable add CTA |
| `src/app/_components/admin/DropBox.tsx` | react-dropzone wrapper + hidden file input |
| `src/app/_components/admin/TotalStaff.tsx` | Staff totals (may be placeholder) |
| `src/app/_components/PageFileStagingDropzone.tsx` | Page-level file staging for flows that need a file before navigating |
| `src/app/_components/ModeToggle.tsx` | Theme dropdown in dashboard header |

---

## `src/components/ui/*` (shadcn-style)

These are **reusable primitives**. Names match shadcn patterns.

| File | Purpose |
|------|---------|
| `alert.tsx` | Status / info / destructive alerts |
| `button.tsx` | `Button` + `buttonVariants` (CVA) |
| `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardContent`, … |
| `checkbox.tsx` | Radix checkbox + Lucide check |
| `dialog.tsx` | Modal dialog + overlay + close |
| `direction.tsx` | RTL/LTR context for Radix |
| `dropdown-menu.tsx` | Menus (profile, language, theme) |
| `field.tsx` | Form field helpers (labels, errors) used on auth pages |
| `input.tsx` | Text input styles |
| `label.tsx` | Accessible label |
| `pagination.tsx` | Page controls (used in `ProfTable`) |
| `select.tsx` | Radix `Select` (year, grade, semester, etc.) |
| `separator.tsx` | Visual divider |
| `sheet.tsx` | Slide-over panel (professor editor) |

---

## `src/lib/*` (logic your friend should read first)

| File | Purpose |
|------|---------|
| `utils.ts` | `cn()` class merge + **Web Notifications** helpers (`notifyUser`, …) |
| `constants.ts` | App constants, sidebar config per role, routes, i18n helpers |
| `tokenStorage.ts` | **localStorage/sessionStorage** for JWT, refresh, app role, **dev role override** |
| `api.ts` | Login/register/refresh helpers, token persistence |
| `auth.ts` | Auth-related helpers (if present) |
| `fetchErrors.ts` | `isNetworkFailure`, user-facing API unreachable messages |
| `drfError.ts` | Django REST Framework error parsing |
| `roleRouteAccess.ts` | Which paths each role may open (used by `DashboardRoleGuard`) |
| `useEffectiveAppRole.ts` | Hook: current role including dev override + event sync |
| `useRedirectIfAuthenticated.ts` | Redirect logged-in users away from login (if used) |

---

## Typical flows (mental model)

1. **Login** → `api.login` stores tokens + role → redirect to dashboard.  
2. **Dashboard** → `useEffectiveAppRole` → sidebar from `constants.ts`.  
3. **Guards** → `roleRouteAccess` + `DashboardRoleGuard` block wrong URLs.  
4. **API calls** → `getAccessToken()` attached as `Authorization: Bearer`.  
5. **Dev role switcher** → only changes **stored preview role** + UI; JWT unchanged.

---

## Conventions

- **`"use client"`** on components that use hooks, browser APIs, or event handlers.  
- **`@/` imports** map to `src/` (see `tsconfig.json` paths).  
- **Arabic** via `language === "ar"` and `dir` from `language-provider`.  
- **Env**: `NEXT_PUBLIC_API_URL` for backend base URL.

---

## How to document new code

- Add a **file-level comment** (2–6 lines) at the top when the file is not obvious.  
- Comment **why**, not **what** (the code already shows what).  
- For complex functions, a short block above the function is enough.  
- Update **this guide** when you add a new area or rename files.

---

*Generated as a readable alternative to line-by-line comments across the whole tree.*
