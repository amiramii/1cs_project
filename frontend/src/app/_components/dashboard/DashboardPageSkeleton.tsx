import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Variant = "default" | "table" | "compact" | "schedule"

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

  if (variant === "schedule") {
    return (
      <section
        className={cn(
          "mt-4 flex min-h-[calc(100dvh-7.5rem)] w-full min-w-0 max-w-none flex-1 flex-col space-y-4 self-stretch",
          className
        )}
        role="status"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="flex w-full max-w-none flex-wrap items-center justify-between gap-2 sm:gap-3">
          <Skeleton className="h-10 w-24 shrink-0 rounded-md bg-muted sm:w-28" />
          <Skeleton className="h-6 w-32 max-w-[60%] rounded-md bg-muted sm:h-7 sm:w-48 xl:w-56" />
          <Skeleton className="h-10 w-24 shrink-0 rounded-md bg-muted sm:w-28" />
        </div>
        <div className="flex w-full min-w-0 max-w-none flex-1 flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 min-h-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-[#F6F9FB] p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-sm bg-muted ring-1 ring-border/40" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded-md bg-muted" />
                <Skeleton className="h-3 w-16 rounded-md bg-muted/90" />
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:max-w-2xl">
              <Skeleton className="h-10 w-full flex-1 rounded-xl bg-[#FEF9F9] ring-1 ring-slate-200/80" />
              <Skeleton className="h-10 w-full rounded-xl bg-[#FEF9F9] ring-1 ring-slate-200/80 sm:min-w-[10.5rem]" />
            </div>
          </div>
          <div className="mt-4 grid min-h-[8rem] w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="min-w-0"
              >
                <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <Skeleton className="h-[168px] w-full rounded-none bg-muted/80" />
                  <div className="grid grid-cols-2 divide-x divide-slate-200 bg-white py-2">
                    <Skeleton className="mx-2 h-3 justify-self-center bg-muted/90" />
                    <Skeleton className="mx-2 h-3 justify-self-center bg-muted/90" />
                  </div>
                  <Skeleton className="h-9 w-full rounded-none bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (variant === "table") {
    return (
      <section
        className={cn(
          "mx-auto w-full min-w-0 max-w-full space-y-4 self-stretch overflow-x-hidden rounded-xl border border-border/80 bg-card/50 p-4 shadow-sm",
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
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-md bg-muted/90" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 max-w-[96rem] space-y-8 self-stretch px-2 sm:px-3 md:px-4",
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-10 w-24 rounded-md bg-muted" />
        <Skeleton className="h-8 w-32 rounded-md bg-muted md:h-9 md:w-48" />
        <Skeleton className="h-10 w-24 rounded-md bg-muted" />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-muted/30 p-6 shadow-sm md:p-8">
        <Skeleton className="h-3 w-28 rounded-md bg-muted" />
        <Skeleton className="mt-3 h-8 w-3/4 max-w-md rounded-md md:h-9 bg-muted" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl rounded-md bg-muted" />
        <Skeleton className="mt-2 h-4 w-5/6 max-w-xl rounded-md bg-muted" />
        <div className="mt-6 flex flex-wrap gap-3">
          <Skeleton className="h-10 flex-1 rounded-xl bg-muted/80 sm:min-w-[8rem] sm:max-w-[14rem]" />
          <Skeleton className="h-10 flex-1 rounded-xl bg-muted/80 sm:min-w-[8rem] sm:max-w-[14rem]" />
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
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
          {Array.from({ length: 9 }).map((_, i) => (
            <li key={i}>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 shadow-sm">
                <Skeleton className="h-4 flex-1 rounded-md bg-muted" />
                <Skeleton className="size-4 shrink-0 rounded-md bg-muted" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <Skeleton className="h-4 w-48 rounded-md bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-muted/70 ring-1 ring-border/50" />
          ))}
        </div>
      </section>
    </div>
  )
}
