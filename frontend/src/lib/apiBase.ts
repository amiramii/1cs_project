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
