import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind class names and resolves conflicts (later classes win).
 * Used across shadcn-style components via `cn("...", condition && "foo")`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---------------------------------------------------------------------------
// Browser notifications (Web Notifications API)
// ---------------------------------------------------------------------------
// These helpers are safe to import in React Server Components as long as you
// only *call* them inside client components, `useEffect`, or event handlers.
// The API lives on `window` and is unavailable during SSR.

/** Payload for a desktop / OS notification shown via `new Notification(...)`. */
export type NotifyUserOptions = {
  /** Short headline (taskbar / notification center title). */
  title?: string
  /** Main message body (keep PII out if screenshots are a concern). */
  body: string
  /**
   * Optional deduplication id: a new notification with the same `tag`
   * replaces the previous one instead of stacking infinitely.
   */
  tag?: string
}

/**
 * Returns whether the browser can show Web Notifications at all.
 * Some embedded WebViews (or very old browsers) omit `window.Notification`.
 */
export function isNotificationApiSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

/**
 * Reads the current permission without prompting the user.
 * Returns `"unsupported"` when the API is missing (SSR or old browsers).
 */
export function getNotificationPermission():
  | NotificationPermission
  | "unsupported" {
  if (!isNotificationApiSupported()) return "unsupported"
  return Notification.permission
}

/**
 * Asks the OS permission dialog (browser-controlled). Resolves to the new
 * state after the user answers, or `"unsupported"` if the API is unavailable.
 */
export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!isNotificationApiSupported()) return "unsupported"
  return Notification.requestPermission()
}

/**
 * Absolute URL for a small icon shown in the system notification.
 * Falls back to the app logo in `/public` when no custom URL is provided.
 */
function defaultNotificationIconUrl(): string | undefined {
  if (typeof window === "undefined") return undefined
  return `${window.location.origin}/logo.svg`
}

/**
 * Shows a native OS notification if permission allows.
 *
 * - If permission is `granted`, shows immediately.
 * - If `default`, requests permission once; shows only if the user accepts.
 * - If `denied` or unsupported, returns `false` (use an inline `Alert` in UI).
 *
 * @param optionsOrBody Either a string body or full `NotifyUserOptions`.
 * @returns `true` if a notification was displayed, otherwise `false`.
 */
export async function notifyUser(
  optionsOrBody: NotifyUserOptions | string
): Promise<boolean> {
  if (typeof window === "undefined" || !isNotificationApiSupported()) {
    return false
  }

  const opts: NotifyUserOptions =
    typeof optionsOrBody === "string"
      ? { body: optionsOrBody }
      : optionsOrBody

  const title =
    opts.title ??
    (typeof document !== "undefined" ? document.title : "Notification")

  const icon = defaultNotificationIconUrl()

  const show = () => {
    try {
      new Notification(title, {
        body: opts.body,
        tag: opts.tag,
        icon,
      })
      return true
    } catch {
      return false
    }
  }

  if (Notification.permission === "granted") {
    return show()
  }

  if (Notification.permission === "denied") {
    return false
  }

  const permission = await Notification.requestPermission()
  if (permission === "granted") {
    return show()
  }

  return false
}
