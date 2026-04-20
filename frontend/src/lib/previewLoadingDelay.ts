/**
 * Artificial delay so route `loading.tsx` (bookshelf, skeletons) stays visible longer.
 *
 * - Set `NEXT_PUBLIC_PREVIEW_LOADING_MS` in `.env.local` (milliseconds). Use `0` to disable.
 * - Default is 0. Set `NEXT_PUBLIC_PREVIEW_LOADING_MS=5000` to preview loaders.
 */
export async function previewLoadingDelay(): Promise<void> {
  const raw = process.env.NEXT_PUBLIC_PREVIEW_LOADING_MS
  let ms = 0
  if (raw !== undefined && raw !== "") {
    const n = Number.parseInt(raw, 10)
    ms = Number.isFinite(n) && n >= 0 ? n : 0
  }
  if (ms <= 0) return
  await new Promise<void>((r) => setTimeout(r, ms))
}
