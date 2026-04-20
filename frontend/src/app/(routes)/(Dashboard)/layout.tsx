'use client'

/**
 * Dashboard shell: sidebar (or top nav for schooling), sticky header with
 * language + theme + profile menu, and main content area guarded by
 * `DashboardRoleGuard`. Role comes from JWT + optional dev role switcher.
 */
import Link from "next/link";
import Sidebar from "../../../components/ui/siderbar";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import {ModeToggle} from "../../_components/ModeToggle";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarMenuIcon } from "../../../components/ui/sidebarMenuIcon";
import { useLanguage } from "../../_components/language-provider";
import LanguageMenu from "../../_components/login/LanguageMenu";
import { clearTokens } from "../../../lib/tokenStorage";
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

  const navItems = getSideBarItems(language, role);
  const sidebarTx = getSidebarChromeTexts(language);
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
  const profileName = language === "ar" ? "مستخدم تشيكن" : "Chekin User";

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

  const shellClass = isSchooling
    ? "flex min-h-screen flex-1 flex-col transition-all duration-200"
    : `flex min-h-screen flex-1 flex-col pb-24 md:pb-0 transition-all duration-200 ${
        expanded ? (isRtl ? "md:mr-64" : "md:ml-64") : isRtl ? "md:mr-24" : "md:ml-24"
      }`;

  return (
    <NotificationProvider>
    <div className="min-h-screen bg-background text-foreground">
      {!isSchooling && (
        <Sidebar
          expanded={expanded}
          setExpanded={setExpanded}
          role={role}
        />
      )}
      <div className={shellClass}>
      <header className="sticky top-0 z-30 flex min-h-16 w-full items-center justify-between gap-3 border-b border-border/70 bg-background/90 px-4 backdrop-blur sm:px-6">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-primary/8 to-transparent" />
        {isSchooling ? (
          <nav
            className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden"
            aria-label="Schooling"
          >
            {navItems.map((item) => {
              const active = item.href === activeItem.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <SidebarMenuIcon id={item.iconId} size={16} className="shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : (
          <div className="flex min-w-0 items-center gap-2 text-foreground">
            <SidebarMenuIcon id={activeItem.iconId} size={18} className="shrink-0" />
            <span className="truncate text-sm font-semibold sm:text-base">{activeItem.label}</span>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <LanguageMenu language={language} onChange={setLanguage} />
            <NotificationBell />
            <ModeToggle/>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="ms-1 h-10 w-10 shrink-0 rounded-full border-border bg-card p-0 hover:bg-accent"
                  aria-label={language === "ar" ? "الحساب" : "Account menu"}
                >
                  <User className="text-muted-foreground" size={22} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isRtl ? "start" : "end"}
                className="min-w-[min(100vw-2rem,9rem)] p-0 "
              >
                <DropdownMenuLabel className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{profileName}</p>
                  <p className="text-xs font-normal text-muted-foreground">{profileGroup}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                  {sidebarTx.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      <NotificationOnboardingDialog />
      <main className={`mx-auto flex min-w-0 max-w-full flex-1 flex-col overflow-x-hidden px-4 py-4 sm:px-5 lg:px-6 ${isSchooling ? "items-stretch" : "items-center"}`}>
        <DashboardRoleGuard>{children}</DashboardRoleGuard>
      </main>
      <DevRoleSwitcher />
      <Toaster richColors position={isRtl ? "top-left" : "top-right"} />
      </div>
    </div>
    </NotificationProvider>
  );
}
