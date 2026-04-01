"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthPageBackground } from "@/app/_components/login/AuthPageBackground"
import { ModeToggle } from "@/app/_components/ModeToggle"
import { Button } from "@/components/ui/button"
import { FieldError, FieldTitle } from "@/components/ui/field"
import LanguageMenu from "@/app/_components/login/LanguageMenu"
import PasswordInput from "@/app/_components/login/PasswordInput"
import api from "@/lib/api"
import login from "@/lib/auth"
import {
  PASSWORD_SYMBOL_REGEX,
  RESET_EMAIL_STORAGE_KEY,
  getLoginTexts,
  getStoredLanguage,
  setStoredLanguage,
} from "@/lib/constants"
type PageProps = {
  params: {
    uidb64: string
    token: string
  }
}

export default function ResetPasswordPage({ params }: PageProps) {
  const router = useRouter()
  const [language, setLanguage] = useState<"en" | "ar">(() => getStoredLanguage())
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [touched, setTouched] = useState({ password: false, confirmPassword: false })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const t = getLoginTexts(language)

  useEffect(() => setStoredLanguage(language), [language])

  const passwordError = useMemo(() => {
    if (!password) return t.passwordRequired
    if (password.length < 8) return t.passwordComplexity
    if (!/\d/.test(password)) return t.passwordComplexity
    if (!/[a-z]/.test(password)) return t.passwordComplexity
    if (!/[A-Z]/.test(password)) return t.passwordComplexity
    if (!PASSWORD_SYMBOL_REGEX.test(password)) return t.passwordComplexity
    return ""
  }, [password, t.passwordRequired, t.passwordComplexity])

  const confirmPasswordError = useMemo(() => {
    if (!confirmPassword) return t.confirmPasswordRequired
    if (confirmPassword !== password) return t.passwordMismatch
    return ""
  }, [confirmPassword, password, t.confirmPasswordRequired, t.passwordMismatch])

  const handleSave = async () => {
    setTouched({ password: true, confirmPassword: true })
    if (passwordError || confirmPasswordError) return

    setError("")
    setLoading(true)
    try {
      const resetRes = await api(
        "api/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uidb64: params.uidb64,
            token: params.token,
            new_password: password,
          }),
        },
        { withAuth: false }
      )

      const resetBody = await resetRes.json().catch(() => ({}))
      if (!resetRes.ok) {
        setError(resetBody?.error ?? t.resetFailed)
        return
      }

      const storedEmail = localStorage.getItem(RESET_EMAIL_STORAGE_KEY)
      if (!storedEmail) {
        setError(t.autoLoginFailed)
        router.push("/Login")
        return
      }

      try {
        await login(storedEmail, password)
        localStorage.removeItem(RESET_EMAIL_STORAGE_KEY)
        router.push("/Dashboard")
      } catch {
        setError(t.autoLoginFailed)
        router.push("/Login")
      }
    } catch {
      setError(t.resetFailed)
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

        <FieldTitle className="text-center text-2xl mb-4 self-center font-montserrat font-semi-bold">
          {t.resetTitle}
        </FieldTitle>

        <form
          className="w-full flex flex-col gap-4"
          dir={language === "ar" ? "rtl" : "ltr"}
          onSubmit={(e) => {
            e.preventDefault()
            void handleSave()
          }}
        >
          <PasswordInput
            id="new-password"
            label={t.password}
            value={password}
            touched={touched.password}
            error={passwordError}
            showPassword={showPassword}
            placeholder={language === "ar" ? "أدخل كلمة المرور الجديدة" : "Enter new password"}
            onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
            onChange={setPassword}
            onToggleShow={() => setShowPassword((prev) => !prev)}
          />

          <PasswordInput
            id="confirm-password"
            label={t.confirmPassword}
            value={confirmPassword}
            touched={touched.confirmPassword}
            error={confirmPasswordError}
            showPassword={showConfirmPassword}
            placeholder={language === "ar" ? "أكد كلمة المرور" : "Confirm new password"}
            onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
            onChange={setConfirmPassword}
            onToggleShow={() => setShowConfirmPassword((prev) => !prev)}
          />

          <div className="min-h-[20px]">
            {touched.password && passwordError ? (
              <FieldError>{passwordError}</FieldError>
            ) : touched.confirmPassword && confirmPasswordError ? (
              <FieldError>{confirmPasswordError}</FieldError>
            ) : error ? (
              <FieldError>{error}</FieldError>
            ) : null}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => router.push("/Login")}
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-primary dark:bg-blue-secondary rounded-full"
            >
              {loading ? "..." : t.saveChanges}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
