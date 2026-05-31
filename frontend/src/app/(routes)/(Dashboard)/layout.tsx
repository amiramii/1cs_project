'use client'

/**
 * Dashboard shell: sidebar (or top nav for schooling), sticky header with
 * language + theme + profile menu, and main content area guarded by
 * `DashboardRoleGuard`. Role comes from JWT + optional dev role switcher.
 */
import Link from "next/link";
import Sidebar from "../../../components/ui/siderbar";
import { useRouter } from "next/navigation";
import { CircleUserRound } from "lucide-react";
import {ModeToggle} from "../../_components/ModeToggle";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarMenuIcon } from "../../../components/ui/sidebarMenuIcon";
import { useLanguage } from "../../_components/language-provider";
import LanguageMenu from "../../_components/login/LanguageMenu";
import { clearTokens, getCurrentUserDisplayName } from "../../../lib/tokenStorage";
import { useEffectiveAppRole } from "../../../lib/useEffectiveAppRole";
import DevRoleSwitcher from "../../_components/DevRoleSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  DEFAULT_APP_ROLE,
  getSideBarItems,
  getSidebarChromeTexts,
  type AppSidebarRole,
} from "../../../lib/constants";
import DashboardRoleGuard from "../../_components/DashboardRoleGuard";
import NotificationBell from "../../_components/notifications/NotificationBell";
import NotificationOnboardingDialog from "../../_components/notifications/NotificationOnboardingDialog";
import { NotificationProvider } from "../../_components/notifications/NotificationProvider";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { fetchAndApplyAbsenceConfigFromApi } from "@/lib/moduleExclusionPolicy";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expanded,setExpanded]=useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const role = useEffectiveAppRole(DEFAULT_APP_ROLE) as AppSidebarRole;
  const isSchooling = role === "schooling";
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);

  const navItems = getSideBarItems(language, role);
  const sidebarTx = getSidebarChromeTexts(language);

  const DASHBOARD_HOME_SEEN_KEY = "chekin:dashboard-home-seen";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = (pathname ?? "/").split("?")[0]?.replace(/\/$/, "") || "/";
    if (path === "/Dashboard") {
      sessionStorage.setItem(DASHBOARD_HOME_SEEN_KEY, "1");
      return;
    }
    const onSidebarRoute = navItems.some(
      (item) => path === item.href || path.startsWith(`${item.href}/`)
    );
    if (!onSidebarRoute) return;
    if (!sessionStorage.getItem(DASHBOARD_HOME_SEEN_KEY)) {
      router.replace("/Dashboard");
    }
  }, [pathname, router, navItems]);

  useEffect(() => {
    queueMicrotask(() => setUserDisplayName(getCurrentUserDisplayName()));
  }, []);

  useEffect(() => {
    void fetchAndApplyAbsenceConfigFromApi();
  }, []);
  const profileGroup =
    role === "admin"
      ? language === "ar"
        ? "المشرف"
        : "Admin"
      : role === "schooling"
        ? language === "ar"
          ? "الشؤون الأكاديمية"
          : "Schooling"
      : role === "prof"
        ? language === "ar"
          ? "الأستاذ"
          : "Professor"
        : language === "ar"
          ? "الطالب"
          : "Student";
  const profileName =
    userDisplayName ?? (language === "ar" ? "مستخدم تشيكن" : "Chekin User");

  const handleLogout = () => {
    clearTokens();
    router.push("/Login");
  };
  const activeItem =
    navItems.find((item) => pathname === item.href) ??
    navItems.find((item) =>
      item.href === "/Dashboard"
        ? pathname.startsWith("/Dashboard")
        : pathname.startsWith(`${item.href}/`) || pathname.startsWith(item.href)
    ) ??
    navItems[0];

  /** Sidebar is fixed: use padding (not margin) so w-full does not overflow the viewport. */
  const shellClass = `box-border flex min-h-screen w-full min-w-0 max-w-full flex-col pb-24 transition-[padding] duration-200 md:pb-0 ${
    expanded
      ? isRtl
        ? "md:pe-64"
        : "md:ps-64"
      : isRtl
        ? "md:pe-24"
        : "md:ps-24"
  }`;

  return (
    <NotificationProvider>
    <div className="relative min-h-screen w-full max-w-[100vw] text-foreground font-montserrat">
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        {/* Light background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#74A7BD]/10 via-[#FEF9F9] to-[#FEF9F9] dark:hidden" />
        <div className="absolute -end-16 top-0 h-44 w-44 rounded-full bg-fuchsia-200/35 blur-3xl dark:hidden" />
        <div className="absolute -end-20 top-8 h-48 w-48 rounded-full bg-[#74A7BD]/12 blur-3xl dark:hidden" />
        <div className="absolute end-8 bottom-0 h-32 w-32 rounded-full bg-sky-200/25 blur-2xl dark:hidden" />

        {/* Dark background — #141726 main tone */}
        <div className="absolute inset-0 hidden bg-[#141726] dark:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-br from-[#141726] via-[#19203A] to-[#111322] dark:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-tl from-[#29587f]/38 via-transparent to-transparent dark:block" />
        <div className="absolute -end-24 top-0 hidden h-64 w-64 rounded-full bg-[#29587f]/30 blur-3xl dark:block md:-end-32 md:h-80 md:w-80" />
        <div className="absolute start-0 bottom-0 hidden h-48 w-48 rounded-full bg-[#383F58]/10 blur-3xl dark:block md:bottom-[-2rem] md:h-64 md:w-64" />
      </div>
        <Sidebar
          expanded={expanded}
          setExpanded={setExpanded}
          role={role}
        />
      <div className={shellClass}>
      <header className="z-50 box-border flex h-16 w-full max-w-full shrink-0 items-center justify-between gap-3 border-b border-[#74A7BD]/20 bg-[#FEF9F9] px-4 shadow-md backdrop-blur-md max-md:fixed max-md:start-0 max-md:end-0 max-md:top-0 sm:px-6 md:sticky md:top-0 dark:border-[#51689A]/30 dark:bg-[#141726] dark:text-[#EEF4F7] dark:shadow-black/25">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-[#74A7BD]/8 to-transparent dark:via-[#29587f]/30" />
          <div className="flex min-w-0 items-center gap-2 text-[#1B2065] dark:text-[#EEF4F7]">
            <SidebarMenuIcon id={activeItem.iconId} size={18} className="shrink-0 text-[#1B2065] dark:text-[#EEF4F7]" />
            <span className="truncate text-sm font-semibold sm:text-base">{activeItem.label}</span>
          </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4 ">
            <LanguageMenu language={language} onChange={setLanguage} />
            <ModeToggle/>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  className="ms-1 h-12 w-12 shrink-0 rounded-full bg-[#FEF9F9] p-2 text-[#1B2065] hover:bg-[#EEF4F7] dark:bg-[#242A40] dark:text-[#EEF4F7] dark:hover:bg-[#2E3650]"
                  aria-label={language === "ar" ? "الحساب" : "Account menu"}
                >
                  <CircleUserRound className="size-7" strokeWidth={1} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isRtl ? "start" : "end"}
                className="min-w-[min(100vw-2rem,9rem)] border-[#D6DEEF] bg-[#FEF9F9] p-0 dark:border-[#383F58] dark:bg-[#1A2036]"
              >
                <DropdownMenuLabel className="space-y-1">
                  <p className="text-sm font-semibold text-[#1B2065] dark:text-[#EEF4F7]">{profileName}</p>
                  <p className="text-xs font-normal text-[#5D719D] dark:text-[#9BA8C4]">{profileGroup}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                  {sidebarTx.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      {/* Reserves space under the fixed mobile header so content is not covered */}
      <div className="h-16 w-full shrink-0 max-md:block md:hidden" aria-hidden />
      <NotificationOnboardingDialog />
      <main className="flex w-full min-w-0 flex-1 flex-col items-stretch bg-transparent px-4 pb-6 pt-3 sm:px-6 lg:px-8">
        <DashboardRoleGuard>{children}</DashboardRoleGuard>
      </main>
      <DevRoleSwitcher />
      <Toaster richColors position={isRtl ? "top-left" : "top-right"} />
      </div>
    </div>
    </NotificationProvider>
  );
}
