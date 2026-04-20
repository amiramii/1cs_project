/**
 * Root layout for the entire Next.js app.
 * - Loads global Tailwind/CSS variables (`globals.css`).
 * - Registers font CSS variables (Latin + Arabic) used across pages.
 * - Wraps all routes in `Providers` (theme, language, direction, etc.).
 * Child route groups (e.g. `(Dashboard)`) add their own nested layouts.
 */
import type { Metadata } from "next"
import "./globals.css"

import { Inter, Montserrat, Noto_Sans_Arabic } from "next/font/google"
import { Providers } from "./_components/providers"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Chekin",
  description: "Absence management system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${inter.variable} ${montserrat.variable} ${notoArabic.variable}`}
    >
      <body className="min-h-screen antialiased bg-background overflow-x-hidden">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}