"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavItemProps {
  label: string;
  icon?: React.ReactNode;
  count?: number | string;
  details?: string;
  /** Rich footer (e.g. split stats, accent colors). Replaces `details` when set. */
  footer?: React.ReactNode;
  className?: string;
  /** When false, only the top-right icon is shown (no ⋯ menu). */
  showMenu?: boolean;
}

export default function TotalStaff({
  label,
  icon,
  count,
  details,
  footer,
  className,
  showMenu = true,
}: NavItemProps) {
  return (
    <article
      className={cn(
        "relative flex min-h-[140px] min-w-0 w-full flex-1 flex-col rounded-[10px] border border-[#E0E5F2] bg-[#F4F7FE] p-4 dark:border-[#383F58] dark:bg-[#1A2036] pe-4 pt-3 transition-colors sm:min-h-[150px] sm:p-5 sm:pe-5 sm:pt-4",
        className
      )}
    >
      <div
        className={cn(
          "absolute end-2 top-2 z-10 flex flex-col items-end sm:end-3 sm:top-3",
          showMenu ? "gap-0.5 sm:gap-1" : "gap-0"
        )}
      >
        {showMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-[#707EAE] hover:bg-[#E0E5F2]/60 hover:text-[#1B2559] dark:text-[#9BA8C4] dark:hover:bg-[#242A40]/60 dark:hover:text-[#EEF4F7]"
                aria-label="More"
              >
                <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[8rem]">
              <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                Details coming soon
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {icon && (
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center text-[#1B2559] sm:h-9 dark:text-[#EEF4F7] sm:w-9 [&_svg]:h-7 [&_svg]:w-7 sm:[&_svg]:h-8 sm:[&_svg]:w-8",
              showMenu && "mt-0.5"
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <p
        className={cn(
          "text-sm font-medium leading-tight text-[#707EAE] dark:text-[#9BA8C4]",
          showMenu ? "pe-16 sm:pe-20" : "pe-12 sm:pe-14"
        )}
      >
        {label}
      </p>
      <p className="pt-2 text-2xl font-bold leading-none tracking-tight text-[#1B2559] sm:text-3xl dark:text-[#EEF4F7]">
        {count}
      </p>
      <div className="mt-auto flex flex-1 flex-col justify-end pt-3 text-xs sm:text-sm">
        {footer != null ? (
          footer
        ) : details ? (
          <p className="text-[#707EAE] dark:text-[#9BA8C4]">{details}</p>
        ) : null}
      </div>
    </article>
  );
}
