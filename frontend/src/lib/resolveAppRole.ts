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

type ProbeResult = { ok: boolean; status: number };

async function probeAuthenticatedGet(
  path: string,
  accessToken: string
): Promise<ProbeResult> {
  try {
    const res = await fetch(buildApiAbsoluteUrl(path), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

/**
 * Infer the signed-in user's UI role using existing backend permissions (no backend changes).
 * Probes role-specific endpoints; admin is inferred when the token is valid but the user
 * is not student, teacher, or schooling (matches Django's four `User.role` values).
 */
export async function resolveAppRoleFromApi(
  accessToken?: string | null
): Promise<StoredAppRole | null> {
  const token = accessToken ?? getAccessToken();
  if (!token) return null;

  if ((await probeAuthenticatedGet(checkinPath.absences.byModule, token)).ok) {
    return "student";
  }

  if (
    (await probeAuthenticatedGet(checkinPath.teacherAbsence.myRequests, token)).ok
  ) {
    return "prof";
  }

  if (
    (await probeAuthenticatedGet(checkinPath.justifications.collection, token)).ok
  ) {
    return "schooling";
  }

  // Django staff admin (`is_staff`) — UserViewSet uses IsAdminUser
  if ((await probeAuthenticatedGet(checkinPath.users, token)).ok) {
    return "admin";
  }

  // Role-based admin / professor session access
  if (
    (await probeAuthenticatedGet(checkinPath.attendance.sessions, token)).ok
  ) {
    return "admin";
  }

  // Any other authenticated account (typically `User.role == ADMIN`)
  const ping = await probeAuthenticatedGet(
    checkinPath.notifications.unreadCount,
    token
  );
  if (ping.ok) {
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
