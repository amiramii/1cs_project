"use client"

import { ThemeProvider } from "../_components/theme-provider"
import { DirectionProvider } from "@/components/ui/direction"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <DirectionProvider dir="ltr">
        {children}
      </DirectionProvider>
    </ThemeProvider>
  )
}