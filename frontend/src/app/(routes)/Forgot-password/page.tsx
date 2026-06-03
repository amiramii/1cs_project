"use client"
import React, { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "../../_components/ModeToggle"
import { AuthPageBackground } from "../../_components/login/AuthPageBackground"
import { FieldError, FieldTitle } from "@/components/ui/field"
import EmailInput from "../../_components/login/EmailInput"
import api from "@/lib/api"
import { checkinPath } from "@/lib/checkinApi"
import { formatDrfError } from "@/lib/drfError"
import { getApiBaseUrl } from "@/lib/apiBase"
import {
  EMAIL_REGEX,
  RESET_EMAIL_STORAGE_KEY,
  getLoginTexts,
} from "../../../lib/constants"
import { useLanguage } from "@/app/_components/language-provider"
import SubmitButton from "@/app/_components/login/SubmitButton"
import LanguageMenu from "../../_components/login/LanguageMenu"
import { useRedirectIfAuthenticated } from "@/lib/useRedirectIfAuthenticated"

function Page() {
  const router = useRouter()
  const pathname = usePathname()
  const prevPathRef = useRef<string | undefined>(undefined)
  const ready = useRedirectIfAuthenticated()
  const { language, setLanguage } = useLanguage()
  const [email, setEmail] = useState("")
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const t = getLoginTexts(language)

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setTouched(false)
        setError("")
        setSuccess("")
        setEmail("")
      }
    }
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [])

  useEffect(() => {
    const prev = prevPathRef.current
    prevPathRef.current = pathname
    if (pathname === "/Forgot-password" && prev === "/Login") {
      setEmail("")
      setTouched(false)
      setError("")
      setSuccess("")
    }
  }, [pathname])

  if (!ready) return null

  const emailError = !email
    ? t.emailRequired
    : EMAIL_REGEX.test(email)
      ? ""
      : t.emailInvalid

  const submitRequest = async () => {
    setTouched(true)
    setSuccess("")
    if (emailError) {
      return
    }

    setLoading(true)
    setError("")
    try {
      const res = await api(
        checkinPath.resetPasswordRequest,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        },
        { withAuth: false }
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(formatDrfError(body, "Failed to send reset link"))
        return
      }
      localStorage.setItem(
        RESET_EMAIL_STORAGE_KEY,
        email.trim().toLowerCase()
      )
      setSuccess(t.resetSuccess)
    } catch (e) {
      if (e instanceof TypeError) {
        setError(
          `Cannot reach the server at ${getApiBaseUrl()}. Start Django and check NEXT_PUBLIC_API_URL.`
        )
      } else {
        setError("Failed to send reset link")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background min-h-dvh overflow-hidden relative z-0 flex items-center justify-center p-4 w-full">
      <AuthPageBackground />

      <div className="absolute inset-0 bg-white-primary/0 -z-0" />

      <div className="z-20 absolute top-4 right-4">
        <ModeToggle />
      </div>

      <main className="mt-8 w-full max-w-md rounded-3xl border border-border bg-card/80 px-5 py-5 text-foreground backdrop-blur-3xl z-20 sm:mt-10 sm:px-8 sm:py-6">
        <div className="mb-2 flex w-full items-center justify-between gap-3">
          <Button
            type="button"
            variant="link"
            className="inline-flex h-auto shrink-0 items-center gap-1.5 px-0 py-0 font-montserrat text-sm text-blue-primary dark:text-blue-secondary"
            onMouseDown={(e) => e.preventDefault()}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => {
              setTouched(false)
              setError("")
              setSuccess("")
              router.push("/Login")
            }}
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            {t.returnToLogin}
          </Button>
          <LanguageMenu language={language} onChange={setLanguage} />
        </div>

        <FieldTitle className="text-center text-2xl mb-2 self-center font-montserrat font-semi-bold">
          {t.resetTitle}
        </FieldTitle>
        <p className="text-sm text-muted-foreground text-center mb-4">{t.resetHint}</p>

        <form
          className="w-full flex flex-col gap-6"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void submitRequest()
          }}
        >
          <EmailInput
            label={t.email}
            value={email}
            touched={touched}
            error={emailError}
            autoFocus
            onBlur={() => setTouched(true)}
            onChange={setEmail}
          />

          <div className="min-h-[20px]">
            {touched && emailError ? (
              <FieldError>{emailError}</FieldError>
            ) : error ? (
              <FieldError>{error}</FieldError>
            ) : success ? (
              <div className="space-y-1 text-sm text-foreground">
                <p>{success}</p>
                {typeof window !== "undefined" &&
                (window.location.hostname === "localhost" ||
                  window.location.hostname === "127.0.0.1") ? (
                  <p className="text-muted-foreground">{t.resetDevHint}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <SubmitButton
            message={t.resetSubmit}
            loading={loading}
            loadingMessage={language === "ar" ? "جارٍ الإرسال..." : "Sending..."}
          />
        </form>
      </main>
    </div>
  )
}

export default Page