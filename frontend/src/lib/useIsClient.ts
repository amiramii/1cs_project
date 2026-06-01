"use client"

import { useSyncExternalStore } from "react"

/** True after hydration; false during SSR. Avoids setState-in-effect for route guards. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}
