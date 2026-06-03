/**
 * Django API origin (trailing slashes stripped).
 * Local dev default: http://127.0.0.1:8000
 */
const DEFAULT_API = "http://127.0.0.1:8000"

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "")
}

/** True when the page was opened via a LAN IP (phone WebView → PC dev server). */
function isLanIpv4Host(host: string): boolean {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) && host !== "127.0.0.1"
}

export function getApiBaseUrl(): string {
  const fromEnv = stripTrailingSlashes(
    process.env.NEXT_PUBLIC_API_URL || DEFAULT_API
  )

  // Mobile local dev: WebView at http://PC_IP:3000 must call http://PC_IP:8000, not 127.0.0.1.
  if (typeof window !== "undefined") {
    const host = window.location.hostname
    if (isLanIpv4Host(host)) {
      return `http://${host}:8000`
    }
  }

  return fromEnv
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
