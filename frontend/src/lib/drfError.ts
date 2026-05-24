/** Flatten Django REST / SimpleJWT error JSON into a single user-facing string. */
export function formatDrfError(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback
  const b = body as Record<string, unknown>

  if (typeof b.detail === "string") return b.detail
  if (Array.isArray(b.detail)) {
    const parts = b.detail.filter((x): x is string => typeof x === "string")
    if (parts.length) return parts.join(" ")
  }

  if (typeof b.error === "string") return b.error

  const messages: string[] = []
  for (const v of Object.values(b)) {
    if (typeof v === "string") messages.push(v)
    else if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string") messages.push(item)
      }
    }
  }
  return messages[0] ?? fallback
}

/**
 * Turns HTML debug pages / JSON bodies into short toast-safe text.
 * Django `OperationalError` in DEBUG renders as HTML — avoid dumping `<!DOCTYPE…>` into alerts.
 */
export function summarizeUpstreamError(text: string, status: number): string {
  const t = text.trim()
  if (!t) return `Request failed (${status}).`

  const head = t.slice(0, 800).toLowerCase()
  if (
    head.includes("<!doctype html") ||
    head.includes("<html") ||
    head.includes("traceback") ||
    head.includes("operationalerror")
  ) {
    const m = t.match(/<title>\s*([\s\S]*?)\s*<\/title>/i)
    const titleLine = m?.[1]?.replace(/\s+/g, " ").trim()

    const dbHint =
      status >= 500
        ? "Often a DB issue: confirm migrations ran (`migrate`), tables exist, and DATABASES matches your engine."
        : "The server returned an HTML error page instead of JSON."

    if (titleLine) return `${titleLine} ${dbHint}`
    return `Server error (${status}). ${dbHint}`
  }

  try {
    const j = JSON.parse(t) as unknown
    const parsed = formatDrfError(j, "")
    if (parsed) return parsed
  } catch {
    /* not JSON */
  }

  return t.length > 280 ? `${t.slice(0, 260)}…` : t
}
