"use client"
import React, { useEffect, useState } from "react"
import { ModeToggle } from "../../_components/ModeToggle"
import { AuthPageBackground } from "../../_components/login/AuthPageBackground"
import { FieldError, FieldTitle } from "@/components/ui/field"
import EmailInput from "../../_components/login/EmailInput"
import api from "@/lib/api"
import {
  EMAIL_REGEX,
  RESET_EMAIL_STORAGE_KEY,
  getLoginTexts,
  getStoredLanguage,
  setStoredLanguage,
} from "../../../lib/constants"
import SubmitButton from "@/app/_components/login/SubmitButton"
import LanguageMenu from "../../_components/login/LanguageMenu"
//import { useRedirectIfAuthenticated } from "@/lib/useRedirectIfAuthenticated"

function Page() {
  //const ready = useRedirectIfAuthenticated()
  const [language, setLanguage] = useState<"en" | "ar">(() => getStoredLanguage())
  const [email, setEmail] = useState("")
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const t = getLoginTexts(language)

  useEffect(() => {
    setStoredLanguage(language)
  }, [language])

  // if (!ready) return null

  const emailError = !email
    ? t.emailRequired
    : EMAIL_REGEX.test(email)
      ? ""
      : t.emailInvalid

  const submitRequest = async () => {
    setTouched(true)
    setSuccess("")
    if (emailError) {
      setError(emailError)
      return
    }

    setLoading(true)
    setError("")
    try {
      const res = await api(
        "api/reset-password-request",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
        { withAuth: false }
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error ?? "Failed to send reset link")
        return
      }
      localStorage.setItem(RESET_EMAIL_STORAGE_KEY, email)
      setSuccess(t.resetSuccess)
    } catch (e) {
      setError("Failed to send reset link")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background h-dvh overflow-hidden relative z-0 flex items-center justify-center p-4 w-full">
      <AuthPageBackground />

      <div className="absolute inset-0 bg-white-primary/0 -z-0" />

      <div className="z-20 absolute top-4 right-4">
        <ModeToggle />
      </div>

      <main className="w-full max-w-md bg-card/80 backdrop-blur-3xl border border-border flex flex-col rounded-3xl py-6 px-8 text-foreground z-20">
        <div className="self-end mb-2">
          <LanguageMenu language={language} onChange={setLanguage} />
        </div>

        <FieldTitle className="text-center text-2xl mb-2 self-center font-montserrat font-semi-bold">
          {t.resetTitle}
        </FieldTitle>
        <p className="text-sm text-muted-foreground text-center mb-4">{t.resetHint}</p>

        <form
          className="w-full flex flex-col gap-6"
          dir={language === "ar" ? "rtl" : "ltr"}
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
              <p className="text-sm text-foreground">{success}</p>
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