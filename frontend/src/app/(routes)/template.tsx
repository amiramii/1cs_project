import { previewLoadingDelay } from "@/lib/previewLoadingDelay"

/**
 * Remounts on each navigation within (routes), so the preview delay runs
 * every time (unlike layout). Keeps loading UI visible longer for review.
 */
export default async function RoutesTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  await previewLoadingDelay()
  return <>{children}</>
}
