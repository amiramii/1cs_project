/**
 * Remounts on each navigation within (routes). Kept synchronous so loading.tsx
 * can show immediately; avoid async work here (it caused content/loader ordering glitches).
 */
export default function RoutesTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
