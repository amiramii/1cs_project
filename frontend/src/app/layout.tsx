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