/**
 * Django API origin (same as `NEXT_PUBLIC_API_URL`, trailing slashes stripped).
 * Backend routes are mounted under `/api/...` (see Checkin_backend `urls.py`).
 */
export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(
    /\/+$/,
    ""
  )
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
