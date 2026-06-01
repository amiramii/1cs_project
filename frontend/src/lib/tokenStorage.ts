const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";
const APP_ROLE_KEY = "app_role";
const USER_EMAIL_KEY = "chekin_user_email";

/** Development only: when set, UI pretends this role (JWT still used for API calls). */
const DEV_APP_ROLE_OVERRIDE_KEY = "dev_app_role_preview";

function isDevRolePreviewEnabled(): boolean {
  return (
    typeof process !== "undefined" &&
    process.env.NODE_ENV === "development"
  );
}

/** Fired when dev role preview changes (development only). */
export const DEV_APP_ROLE_CHANGED_EVENT = "dev-app-role-override-changed";

function dispatchDevRoleChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DEV_APP_ROLE_CHANGED_EVENT));
}

/** Clear preview mode (use JWT / stored role again). */
export function clearDevRoleOverride() {
  if (typeof window === "undefined") return;
  if (!isDevRolePreviewEnabled()) return;
  sessionStorage.removeItem(DEV_APP_ROLE_OVERRIDE_KEY);
  dispatchDevRoleChanged();
}

/**
 * Development only: force dashboard UI to behave as this role.
 * Does not change API permissions (token unchanged).
 */
export function setDevRoleOverride(role: StoredAppRole) {
  if (typeof window === "undefined") return;
  if (!isDevRolePreviewEnabled()) return;
  sessionStorage.setItem(DEV_APP_ROLE_OVERRIDE_KEY, role);
  dispatchDevRoleChanged();
}

export function getDevRoleOverride(): StoredAppRole | null {
  if (typeof window === "undefined") return null;
  if (!isDevRolePreviewEnabled()) return null;
  const raw = sessionStorage.getItem(DEV_APP_ROLE_OVERRIDE_KEY);
  return normalizeRole(raw);
}

export type StoredAppRole = "admin" | "prof" | "student" | "schooling";

type JwtPayload = {
  exp?: number;
  role?: unknown;
  user_role?: unknown;
  userType?: unknown;
  user_type?: unknown;
  type?: unknown;
  groups?: unknown;
  is_superuser?: unknown;
  is_staff?: unknown;
  full_name?: unknown;
  name?: unknown;
  username?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  email?: unknown;
};

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_KEY) ?? localStorage.getItem(ACCESS_KEY);
}

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function normalizeRole(raw: unknown): StoredAppRole | null {
  if (typeof raw !== "string") return null;
  const role = raw.toLowerCase().trim();

  if (role === "admin" || role === "administrator" || role === "superuser") {
    return "admin";
  }

  if (
    role === "prof" ||
    role === "professor" ||
    role === "teacher" ||
    role === "teaching"
  ) {
    return "prof";
  }

  if (role === "student" || role === "etudiant") {
    return "student";
  }

  /** Django `User.Roles.SCHOOLING` — academic office / scolarité */
  if (
    role === "schooling" ||
    role === "scolarity" ||
    role === "scolarité"
  ) {
    return "schooling";
  }

  return null;
}

function extractRoleFromPayload(payload: JwtPayload | null): StoredAppRole | null {
  if (!payload) return null;

  const directCandidates = [
    payload.role,
    payload.user_role,
    payload.userType,
    payload.user_type,
    payload.type,
  ];

  for (const candidate of directCandidates) {
    const mapped = normalizeRole(candidate);
    if (mapped) return mapped;
  }

  if (payload.is_superuser === true || payload.is_staff === true) {
    return "admin";
  }

  if (Array.isArray(payload.groups)) {
    for (const group of payload.groups) {
      const mapped = normalizeRole(group);
      if (mapped) return mapped;
    }
  }

  return null;
}

/** True when a non-empty access token is present and not expired (if JWT has `exp`). */
export function hasValidAccessToken() {
  const token = getAccessToken()?.trim();
  if (!token) return false;
  const payload = parseJwtPayload(token);
  if (!payload || payload.exp == null) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
}

export function persistUserEmail(email: string, remember: boolean) {
  if (typeof window === "undefined") return;
  const n = email.trim().toLowerCase();
  if (!n) return;
  localStorage.removeItem(USER_EMAIL_KEY);
  sessionStorage.removeItem(USER_EMAIL_KEY);
  (remember ? localStorage : sessionStorage).setItem(USER_EMAIL_KEY, n);
}

export function getStoredUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  return (
    sessionStorage.getItem(USER_EMAIL_KEY) ??
    localStorage.getItem(USER_EMAIL_KEY) ??
    null
  );
}

export function persistTokens(access: string, refresh: string, remember: boolean) {
  if (typeof window === "undefined") return;
  clearTokens();

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(ACCESS_KEY, access);
  storage.setItem(REFRESH_KEY, refresh);
}

/** Clear persisted sidebar role only (tokens unchanged). Next `getCurrentAppRole` reads JWT/storage again. */
export function clearStoredAppRole() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(APP_ROLE_KEY);
  localStorage.removeItem(APP_ROLE_KEY);
}

export function persistAppRole(role: StoredAppRole, remember: boolean) {
  if (typeof window === "undefined") return;
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(APP_ROLE_KEY, role);
}

export function getStoredAppRole(): StoredAppRole | null {
  if (typeof window === "undefined") return null;
  const stored =
    sessionStorage.getItem(APP_ROLE_KEY) ?? localStorage.getItem(APP_ROLE_KEY);
  return normalizeRole(stored);
}

export function getRoleFromAccessToken(token: string): StoredAppRole | null {
  return extractRoleFromPayload(parseJwtPayload(token));
}

function cleanDisplayName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Best-effort display name from JWT payload; returns null when unavailable. */
export function getUserDisplayNameFromAccessToken(token: string): string | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const direct =
    cleanDisplayName(payload.full_name) ??
    cleanDisplayName(payload.name) ??
    cleanDisplayName(payload.username);
  if (direct) return direct;

  const first = cleanDisplayName(payload.first_name);
  const last = cleanDisplayName(payload.last_name);
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;

  const email = cleanDisplayName(payload.email);
  if (email && email.includes("@")) return email.split("@")[0];
  return null;
}

/** Current user display name (JWT first, then stored email local-part). */
export function getCurrentUserDisplayName(): string | null {
  const token = getAccessToken();
  if (token) {
    const fromToken = getUserDisplayNameFromAccessToken(token);
    if (fromToken) return fromToken;
  }
  const email = getStoredUserEmail();
  if (email && email.includes("@")) return email.split("@")[0];
  return null;
}

export function getCurrentAppRole(fallback: StoredAppRole = "admin"): StoredAppRole {
  const devOverride = getDevRoleOverride();
  if (devOverride) return devOverride;

  const token = getAccessToken();
  if (token) {
    const fromToken = getRoleFromAccessToken(token);
    if (fromToken) return fromToken;
  }

  const fromStorage = getStoredAppRole();
  return fromStorage ?? fallback;
}
export function clearTokens(){
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(APP_ROLE_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(APP_ROLE_KEY);
  sessionStorage.removeItem(USER_EMAIL_KEY);
  sessionStorage.removeItem("chekin:dashboard-home-seen");
  if (isDevRolePreviewEnabled()) {
    sessionStorage.removeItem(DEV_APP_ROLE_OVERRIDE_KEY);
    dispatchDevRoleChanged();
  }
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY);
}

/** True when the refresh token lives in localStorage (login with "remember me"). */
export function isRememberMeSession(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(REFRESH_KEY) !== null;
}