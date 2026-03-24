"use client"

import { useState } from "react"

export type Translations = {
  [lang: string]: {
    dir: "ltr" | "rtl"
    values: Record<string, string>
  }
}

export function useTranslation(
  translations: Translations,
  defaultLang: string
) {
  const [lang] = useState(defaultLang)

  const dir = translations[lang].dir
  const t = translations[lang].values

  return { dir, t }
}