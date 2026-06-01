"use client"

/** Shown while auth guards hydrate or redirect (avoids a blank white screen). */
export default function RouteLoadingShell() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <p className="text-sm text-foreground/70">Loading…</p>
    </div>
  )
}
