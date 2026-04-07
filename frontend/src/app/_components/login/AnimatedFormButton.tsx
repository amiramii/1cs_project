"use client"

/**
 * AnimatedFormButton
 *
 * Filled buttons (login, send link): blue base, white hover disk, text + shadow shift on hover.
 * Outline (cancel): optional wash + border/shadow on hover.
 *
 * `suppressHoverAnimation`: reset-password Cancel / Save — static colors, no overlay, no hover
 * text or background treatment (loading spinner still works). Outline still gets hover border.
 */

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type AnimatedFormButtonVariant = "solid" | "outline" | "login"

type AnimatedFormButtonProps = {
  type?: "button" | "submit"
  variant?: AnimatedFormButtonVariant
  lightHoverWhite?: boolean
  /** No expanding fill, no hover text recolor, no hover shadow/border change (e.g. reset form actions). */
  suppressHoverAnimation?: boolean
  loading?: boolean
  loadingLabel?: string
  disabled?: boolean
  onClick?: () => void
  className?: string
  children: React.ReactNode
}

export function AnimatedFormButton({
  type = "button",
  variant = "solid",
  lightHoverWhite = false,
  suppressHoverAnimation = false,
  loading = false,
  loadingLabel,
  disabled,
  onClick,
  className,
  children,
}: AnimatedFormButtonProps) {
  const isOutline = variant === "outline"
  const animateHover = !suppressHoverAnimation

  const label =
    loading && loadingLabel !== undefined ? loadingLabel : children

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      className={cn(
        "w-full min-h-11 py-2.5 px-4 font-montserrat text-base md:text-lg rounded-full relative flex items-center justify-center gap-2 group overflow-hidden active:translate-y-px disabled:pointer-events-none disabled:opacity-55",
        animateHover &&
          "transition-[transform,box-shadow] duration-500 ease-out",
        !animateHover && "transition-transform duration-200",
        isOutline &&
          cn(
            "border-2 border-transparent bg-background/90 text-blue-primary dark:text-blue-secondary",
            animateHover &&
              cn(
                "hover:border-blue-primary/45 dark:hover:border-blue-secondary/55",
                lightHoverWhite
                  ? "shadow-[0_0_20px_rgba(81,104,154,0.1)] hover:shadow-[0_0_32px_rgba(255,255,255,0.72)] dark:shadow-[0_0_20px_rgba(116,167,189,0.18)] dark:hover:shadow-[0_0_32px_rgba(238,244,247,0.42)]"
                  : "shadow-[0_0_24px_rgba(81,104,154,0.12)] hover:shadow-[0_0_28px_rgba(238,244,247,0.85)] dark:shadow-[0_0_24px_rgba(116,167,189,0.2)] dark:hover:shadow-[0_0_30px_rgba(238,244,247,0.35)]"
              ),
            !animateHover &&
              cn(
                "shadow-[0_0_20px_rgba(81,104,154,0.1)] dark:shadow-[0_0_20px_rgba(116,167,189,0.18)]",
                "hover:border-blue-primary/45 dark:hover:border-blue-secondary/55"
              )
          ),
        !isOutline &&
          cn(
            "border-0 bg-blue-primary text-white",
            animateHover &&
              cn(
                "shadow-btn-fill-light-rest hover:shadow-btn-fill-light-hover hover:text-blue-primary",
                "dark:bg-blue-secondary dark:text-white dark:shadow-btn-fill-dark-rest dark:hover:shadow-btn-fill-dark-hover dark:hover:text-blue-primary"
              ),
            !animateHover &&
              cn(
                "shadow-btn-fill-light-rest dark:bg-blue-secondary dark:text-white dark:shadow-btn-fill-dark-rest"
              )
          ),
        className
      )}
    >
      {animateHover && !isOutline && (
        <span
          className="absolute inset-0 z-0 scale-0 origin-center rounded-full bg-white opacity-0 transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100 dark:bg-white-primary"
          aria-hidden
        />
      )}
      {animateHover && isOutline && (
        <span
          className={cn(
            "absolute inset-0 z-0 scale-0 origin-center rounded-full opacity-0 transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100",
            lightHoverWhite && "bg-white dark:bg-blue-secondary/25",
            !lightHoverWhite && "bg-blue-primary/12 dark:bg-blue-secondary/25"
          )}
          aria-hidden
        />
      )}
      {loading && (
        <Loader2
          className="relative z-10 size-5 shrink-0 animate-spin text-inherit"
          aria-hidden
        />
      )}
      <span className="relative z-10 inline-flex items-center justify-center gap-2 transition-colors duration-300">
        {label}
      </span>
    </button>
  )
}
