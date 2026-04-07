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
