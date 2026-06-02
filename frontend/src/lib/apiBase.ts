/**
 * Django API origin (trailing slashes stripped).
 * When the app runs on localhost / LAN, uses `NEXT_PUBLIC_API_URL_LOCAL`.
 * On the deployed site, uses `NEXT_PUBLIC_API_URL`.
 */
const DEFAULT_PRODUCTION_API = "https://checkin-backend-z1f2.onrender.com"
const DEFAULT_LOCAL_API = "http://127.0.0.1:8000"

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "")
}

function isLocalFrontendHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  )
}

function getProductionApiUrl(): string {
  return stripTrailingSlashes(
    process.env.NEXT_PUBLIC_API_URL || DEFAULT_PRODUCTION_API
  )
}

function getLocalApiUrl(): string {
  return stripTrailingSlashes(
    process.env.NEXT_PUBLIC_API_URL_LOCAL || DEFAULT_LOCAL_API
  )
}

function useLocalApiOnDevHost(): boolean {
  const flag = process.env.NEXT_PUBLIC_USE_LOCAL_API?.trim().toLowerCase()
  if (flag === "0" || flag === "false" || flag === "no") return false
  return true
}

export function getApiBaseUrl(): string {
  const production = getProductionApiUrl()
  const local = getLocalApiUrl()

  if (!useLocalApiOnDevHost()) return production

  if (typeof window !== "undefined") {
    return isLocalFrontendHost(window.location.hostname) ? local : production
  }

  if (process.env.NODE_ENV === "development") return local
  return production
}

/**
 * Absolute URL for a path like `api/attendance/sessions` (no leading slash).
 * When the env base already ends with `/api`, strips the duplicate `api/` prefix
 * so requests never hit `.../api/api/...` (matches `lib/api.ts` `buildApiUrl`).
 */
export function buildApiAbsoluteUrl(
  path: string,
  searchParams?: URLSearchParams
): string {
  const base = getApiBaseUrl().replace(/\/+$/, "")
  let cleanPath = path.replace(/^\/+/, "").replace(/\/+$/, "")
  if (base.endsWith("/api") && cleanPath.startsWith("api/")) {
    cleanPath = cleanPath.slice(4)
  }
  let url = `${base}/${cleanPath}/`.replace(/([^:])\/{2,}/g, "$1/")
  if (searchParams && [...searchParams.keys()].length > 0) {
    url += `${url.includes("?") ? "&" : "?"}${searchParams.toString()}`
  }
  return url
}
