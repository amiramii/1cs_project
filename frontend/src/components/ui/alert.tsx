import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Visual variants for `Alert`.
 * - `default`: neutral card-style surface for general information.
 * - `destructive`: reserved for errors and blocking problems (uses destructive palette).
 */
const alertVariants = cva(
  "relative flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-xs [&_svg]:pointer-events-none [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-border bg-card text-card-foreground [&_svg]:text-foreground",
        destructive:
          "border-destructive/40 bg-destructive/5 text-destructive [&_svg]:text-destructive dark:bg-destructive/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Accessible status region (`role="alert"`) for inline messages.
 * Pair with `AlertTitle` / `AlertDescription` and optionally a leading Lucide icon.
 */
function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

/** Short, bold heading inside an `Alert`. */
function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
}

/** Secondary copy; keep sentences short so the alert stays scannable. */
function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-muted-foreground [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
