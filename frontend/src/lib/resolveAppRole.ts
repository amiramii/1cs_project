import { buildApiAbsoluteUrl } from "./apiBase";
import { checkinPath } from "./checkinApi";
import {
  dispatchAppRoleChanged,
  getAccessToken,
  getCurrentAppRole,
  isRememberMeSession,
  persistAppRole,
  type StoredAppRole,
} from "./tokenStorage";

const ROLE_PROBED_SESSION_KEY = "chekin:role-probed";

async function probeAuthenticatedGet(
  path: string,
  accessToken: string
): Promise<boolean> {
  try {
    const res = await fetch(buildApiAbsoluteUrl(path), {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Infer the signed-in user's UI role using existing backend permissions (no backend changes).
 * Probes role-specific endpoints that return 200 only for the matching Django `User.role`.
 */
export async function resolveAppRoleFromApi(
  accessToken?: string | null
): Promise<StoredAppRole | null> {
  const token = accessToken ?? getAccessToken();
  if (!token) return null;

  if (await probeAuthenticatedGet(checkinPath.absences.byModule, token)) {
    return "student";
  }

  if (await probeAuthenticatedGet(checkinPath.teacherAbsence.myRequests, token)) {
    return "prof";
  }

  if (await probeAuthenticatedGet(checkinPath.justifications.collection, token)) {
    return "schooling";
  }

  if (await probeAuthenticatedGet(checkinPath.attendance.sessions, token)) {
    return "admin";
  }

  return null;
}

/** Resolve role from API, persist it, and notify subscribers. */
export async function resolveAndPersistAppRole(
  accessToken?: string | null,
  remember = isRememberMeSession()
): Promise<StoredAppRole | null> {
  const role = await resolveAppRoleFromApi(accessToken);
  if (role) {
    persistAppRole(role, remember);
    dispatchAppRoleChanged();
  }
  return role;
}

/**
 * Probe the API once per browser tab session so stored roles stay in sync
 * with backend permissions (fixes stale admin fallbacks from older builds).
 */
export async function ensureAppRoleResolved(): Promise<StoredAppRole | null> {
  const token = getAccessToken();
  if (!token) return null;

  if (
    typeof window !== "undefined" &&
    sessionStorage.getItem(ROLE_PROBED_SESSION_KEY) === "1"
  ) {
    return getCurrentAppRole();
  }

  const role = await resolveAndPersistAppRole(token);
  if (role && typeof window !== "undefined") {
    sessionStorage.setItem(ROLE_PROBED_SESSION_KEY, "1");
  }
  return role;
}
