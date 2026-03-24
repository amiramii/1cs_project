"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { hasValidAccessToken } from "./tokenStorage"

export function useRedirectIfAuthenticated(redirectTo = "/Dashboard/admin") {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (hasValidAccessToken()) {
      router.replace(redirectTo)
      return
    }
    setReady(true)
  }, [redirectTo, router])

  return ready
}
