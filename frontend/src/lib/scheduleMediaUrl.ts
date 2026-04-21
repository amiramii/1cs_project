import { getApiBaseUrl } from "@/lib/apiBase"

/**
 * Maps any Django-style `/media/...` file URL to same-origin `/api/media/...`
 * so the browser never cross-origin fetches static media (CORS → "Failed to fetch").
 *
 * Matching is pathname-based (not string prefix against getApiBaseUrl) so LAN IPs,
 * localhost vs 127.0.0.1, and mixed env URLs all still proxy.
 */
export function getScheduleFileFetchUrl(url: string): string {
  if (!url || url.startsWith("/api/media/")) return url

  if (url.startsWith("/media/")) {
    const query = url.includes("?") ? url.slice(url.indexOf("?")) : ""
    const pathOnly = url.split("?")[0]!
    return `/api/media/${pathOnly.slice("/media/".length)}${query}`
  }

  try {
    const u = new URL(url)
    const i = u.pathname.indexOf("/media/")
    if (i === -1) return url

    const after = u.pathname.slice(i + "/media/".length)
    return `/api/media/${after}${u.search}`
  } catch {
    /* relative without leading slash */
    const idx = url.indexOf("/media/")
    if (idx !== -1) {
      const rest = url.slice(idx + "/media/".length)
      return `/api/media/${rest}`
    }
    return url
  }
}
