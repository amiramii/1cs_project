"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] shadow-xs transition-shadow outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        // base visuals: box matches the page background, border uses --border, icon uses --foreground
        "bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))]",
        // keep checked state consistent: keep the box matching background and let the indicator inherit foreground
        "data-[state=checked]:bg-[hsl(var(--background))] data-[state=checked]:border-[hsl(var(--border))] data-[state=checked]:text-[hsl(var(--foreground))]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center transition-none text-current [&>svg]:size-3.5"
      >
        <CheckIcon className="text-current" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
