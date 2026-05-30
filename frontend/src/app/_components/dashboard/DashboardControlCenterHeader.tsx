"use client";

import { cn } from "@/lib/utils";

export default function DashboardControlCenterHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#74A7BD]/25 p-6 shadow-sm md:p-8 dark:border-[#383F58]/55",
        className
      )}
    >
      {/* Light */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#74A7BD]/10 via-[#FEF9F9] to-[#FEF9F9] dark:hidden" />
      <div className="pointer-events-none absolute -end-16 -top-16 h-40 w-40 rounded-full bg-fuchsia-200/35 blur-3xl dark:hidden" />
      <div className="pointer-events-none absolute -end-20 top-8 h-48 w-48 rounded-full bg-[#74A7BD]/12 blur-3xl dark:hidden" />
      <div className="pointer-events-none absolute end-8 bottom-0 h-32 w-32 rounded-full bg-sky-200/25 blur-2xl dark:hidden" />
      <div className="pointer-events-none absolute -start-10 -bottom-16 h-44 w-44 rounded-full bg-[#74A7BD]/15 blur-3xl dark:hidden" />

      {/* Dark — #141726 main tone with #29587f gradient accents */}
      <div className="pointer-events-none absolute inset-0 hidden bg-[#141726] dark:block" />
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-br from-[#29587f]/42 via-[#29587f]/20 to-[#141726] dark:block" />
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-tl from-[#29587f]/30 via-transparent to-transparent dark:block" />
      <div className="pointer-events-none absolute -end-24 top-0 hidden h-56 w-56 rounded-full bg-[#29587f]/34 blur-3xl dark:block" />
      <div className="pointer-events-none absolute start-0 bottom-0 hidden h-40 w-40 rounded-full bg-[#383F58]/15 blur-3xl dark:block" />

      <div className="relative z-10">{children}</div>
    </header>
  );
}
