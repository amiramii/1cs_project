"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEV_APP_ROLE_CHANGED_EVENT,
  getCurrentAppRole,
  type StoredAppRole,
} from "@/lib/tokenStorage";

/**
 * Reactive app role for client components. Re-renders when the dev-only role
 * preview changes (development only).
 */
export function useEffectiveAppRole(
  fallback: StoredAppRole = "admin"
): StoredAppRole {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick((n) => n + 1);
    window.addEventListener(DEV_APP_ROLE_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(DEV_APP_ROLE_CHANGED_EVENT, onChange);
  }, []);

  // `tick` is intentionally unused in the computation; it only invalidates the memo
  // when the dev role preview changes.
  return useMemo(() => {
    void tick;
    return getCurrentAppRole(fallback);
  }, [fallback, tick]);
}
