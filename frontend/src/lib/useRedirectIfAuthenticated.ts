"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ENABLE_AUTH_REDIRECTS } from "./constants"
import { hasValidAccessToken } from "./tokenStorage"

export function useRedirectIfAuthenticated(redirectTo = "/Dashboard") {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!ENABLE_AUTH_REDIRECTS) {
      setReady(true)
      return
    }
    if (hasValidAccessToken()) {
      router.replace(redirectTo)
      return
    }
    setReady(true)
  }, [redirectTo, router])

  return ready
}
