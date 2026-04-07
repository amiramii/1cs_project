const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_KEY) ?? localStorage.getItem(ACCESS_KEY);
}

function parseJwtPayload(token: string): { exp?: number } | null {
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

export function hasValidAccessToken() {
  const token = getAccessToken();
  if (!token) return false;
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
}

export function persistTokens(access: string, refresh: string, remember: boolean) {
  if (typeof window === "undefined") return;
  clearTokens();

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(ACCESS_KEY, access);
  storage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens(){
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
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