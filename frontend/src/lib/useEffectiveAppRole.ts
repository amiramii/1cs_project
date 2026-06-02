"use client";

import { useSyncExternalStore } from "react";
import {
  APP_ROLE_CHANGED_EVENT,
  DEV_APP_ROLE_CHANGED_EVENT,
  getCurrentAppRole,
  type StoredAppRole,
} from "@/lib/tokenStorage";

/**
 * Reactive app role for client components. Re-renders when the dev-only role
 * preview changes (development only).
 *
 * Uses `useSyncExternalStore` so the value during SSR + hydration matches
 * `fallback` (no token on server). After hydration, the real role is read from
 * the JWT / storage so the sidebar and guards align with the signed-in user.
 */
export function useEffectiveAppRole(): StoredAppRole | null {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }
      const listener = () => onStoreChange();
      window.addEventListener(DEV_APP_ROLE_CHANGED_EVENT, listener);
      window.addEventListener(APP_ROLE_CHANGED_EVENT, listener);
      return () => {
        window.removeEventListener(DEV_APP_ROLE_CHANGED_EVENT, listener);
        window.removeEventListener(APP_ROLE_CHANGED_EVENT, listener);
      };
    },
    () => getCurrentAppRole(),
    () => null
  );
}
