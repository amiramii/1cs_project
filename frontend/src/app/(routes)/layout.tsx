import RoutesAuthGuard from "@/app/_components/RoutesAuthGuard"

/**
 * Passthrough layout for the `(routes)` group with auth routing:
 * logged-in users cannot open Login / forgot-password / reset-password.
 */
export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RoutesAuthGuard>{children}</RoutesAuthGuard>
}
