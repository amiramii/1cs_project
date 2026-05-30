"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Language } from "@/lib/constants"
import { getStoredLanguage, setStoredLanguage } from "@/lib/constants"
import { DirectionProvider } from "@/components/ui/direction"

type Dir = "ltr" | "rtl"

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  dir: Dir
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return ctx
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    typeof window !== "undefined" ? getStoredLanguage() : "en"
  )
  const skipNextPersist = useRef(true)

  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false
      return
    }
    setStoredLanguage(language)
  }, [language])

  const dir: Dir = language === "ar" ? "rtl" : "ltr"
  const htmlLang = language === "ar" ? "ar" : "en"

  useEffect(() => {
    document.documentElement.lang = htmlLang
    document.documentElement.dir = dir
  }, [dir, htmlLang])

  const value = useMemo(
    () => ({ language, setLanguage, dir }),
    [language, dir]
  )

  return (
    <LanguageContext.Provider value={value}>
      <DirectionProvider dir={dir}>
        <div
          dir={dir}
          lang={htmlLang}
          className={`min-h-screen w-full ${language === "ar" ? "font-arabic" : "font-inter"}`}
        >
          {children}
        </div>
      </DirectionProvider>
    </LanguageContext.Provider>
  )
}
