import { cn } from "@/lib/utils";
import { sessionTypeMeta } from "@/lib/sessionTypeLabel";

export function SessionTypeBadge({
  type,
  isAr,
  className,
}: {
  type: string;
  isAr: boolean;
  className?: string;
}) {
  const meta = sessionTypeMeta(type, isAr);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        meta.className,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
