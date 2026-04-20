import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Variant = "default" | "table" | "compact"

type Props = {
  variant?: Variant
  className?: string
}

/**
 * Theme-aware loading placeholders for dashboard routes (no hard-coded brand blues).
 */
export function DashboardPageSkeleton({ variant = "default", className }: Props) {
  if (variant === "compact") {
    return (
      <div
        className={cn("w-full space-y-4", className)}
        role="status"
        aria-busy="true"
        aria-label="Loading"
      >
        <Skeleton className="mx-auto h-10 w-10 shrink-0 rounded-full bg-muted ring-1 ring-border/60" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-[75%] max-w-xs rounded-md bg-muted" />
          <Skeleton className="h-3 w-full max-w-sm rounded-md bg-muted" />
          <Skeleton className="h-3 w-5/6 rounded-md bg-muted" />
        </div>
      </div>
    )
  }

  if (variant === "table") {
    return (
      <section
        className={cn(
          "mx-auto w-full min-w-0 max-w-full space-y-4 overflow-x-hidden rounded-xl border border-border/80 bg-card/50 p-4 shadow-sm",
          className
        )}
        role="status"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 shrink-0 rounded-md bg-muted" />
            <Skeleton className="h-5 w-36 rounded-md bg-muted" />
          </div>
          <Skeleton className="h-9 w-full max-w-[14rem] rounded-md bg-muted sm:ms-auto" />
        </div>
        <div className="space-y-2 rounded-lg border border-border/60 bg-background/80 p-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-md bg-muted/90" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div
      className={cn("w-full min-w-0 max-w-6xl space-y-8", className)}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-muted/30 p-6 shadow-sm md:p-8">
        <Skeleton className="h-3 w-28 rounded-md bg-muted" />
        <Skeleton className="mt-3 h-8 w-3/4 max-w-md rounded-md md:h-9 bg-muted" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl rounded-md bg-muted" />
        <Skeleton className="mt-2 h-4 w-5/6 max-w-xl rounded-md bg-muted" />
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <article
            key={i}
            className="rounded-xl border border-border/80 bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-24 rounded-md bg-muted" />
              <Skeleton className="size-[18px] shrink-0 rounded-md bg-muted" />
            </div>
            <Skeleton className="mt-3 h-8 w-20 rounded-md bg-muted" />
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <Skeleton className="h-4 w-40 rounded-md bg-muted" />
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 shadow-sm">
                <Skeleton className="h-4 flex-1 rounded-md bg-muted" />
                <Skeleton className="size-4 shrink-0 rounded-md bg-muted" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
