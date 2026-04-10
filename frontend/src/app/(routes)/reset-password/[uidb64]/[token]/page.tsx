"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthPageBackground } from "@/app/_components/login/AuthPageBackground"
import { ModeToggle } from "@/app/_components/ModeToggle"
import { FieldError, FieldTitle } from "@/components/ui/field"
import LanguageMenu from "@/app/_components/login/LanguageMenu"
import { AnimatedFormButton } from "@/app/_components/login/AnimatedFormButton"
import PasswordInput from "@/app/_components/login/PasswordInput"
import api from "@/lib/api"
import login from "@/lib/auth"
import { formatDrfError } from "@/lib/drfError"
import {
  PASSWORD_SYMBOL_REGEX,
  RESET_EMAIL_STORAGE_KEY,
  getLoginTexts,
  getStoredLanguage,
  setStoredLanguage,
} from "@/lib/constants"

export default function ResetPasswordPage() {
  const router = useRouter()
  // useParams() gives the already-decoded route segments.
  // We strip any "=" characters because the console email backend uses quoted-printable
  // encoding which wraps long lines with "=\n". When the URL is copied from the terminal
  // the "=" soft-line-break marker ends up in the path. Django's token and uidb64 never
  // legitimately contain "=" (Django strips base64 padding), so this is always safe.
  const routeParams = useParams()
  const uidb64 = (typeof routeParams?.uidb64 === "string" ? routeParams.uidb64 : "").replace(/=/g, "")
  const token  = (typeof routeParams?.token  === "string" ? routeParams.token  : "").replace(/=/g, "")
  const [language, setLanguage] = useState<"en" | "ar">(() => getStoredLanguage())
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [touched, setTouched] = useState({ password: false, confirmPassword: false })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const submitLockRef = useRef(false)
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

    if (!uidb64 || !token) {
      setError(t.resetFailed)
      return
    }

    if (submitLockRef.current || loading) return
    submitLockRef.current = true

    setError("")
    setLoading(true)
    let leavePageAfterSuccess = false
    try {
      const resetRes = await api(
        "api/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uidb64,
            token,
            new_password: password,
          }),
        },
        { withAuth: false }
      )

      const resetBody = await resetRes.json().catch(() => ({}))
      if (!resetRes.ok) {
        setError(formatDrfError(resetBody, t.resetFailed))
        return
      }

      const storedEmail = localStorage.getItem(RESET_EMAIL_STORAGE_KEY)
      if (!storedEmail) {
        setError(t.autoLoginFailed)
        leavePageAfterSuccess = true
        router.push("/Login")
        return
      }

      try {
        await login(storedEmail, password, false)
        localStorage.removeItem(RESET_EMAIL_STORAGE_KEY)
        leavePageAfterSuccess = true
        router.push("/Dashboard")
      } catch {
        setError(t.autoLoginFailed)
        leavePageAfterSuccess = true
        router.push("/Login")
      }
    } catch {
      setError(t.resetFailed)
    } finally {
      // Do not re-enable after a successful reset: the token is one-time and the password
      // hash changes; a second click would call the API again and get "Invalid or expired token".
      if (!leavePageAfterSuccess) {
        submitLockRef.current = false
        setLoading(false)
      }
    }
  }

  return (
    <div className="bg-background min-h-dvh overflow-hidden relative z-0 flex items-center justify-center p-4 w-full">
      <AuthPageBackground />
      <div className="absolute inset-0 bg-white-primary/0 -z-0" />

      <div className="z-20 absolute top-4 right-4">
        <ModeToggle />
      </div>

      <main className="w-full max-w-md  bg-card/80 backdrop-blur-3xl border border-border flex flex-col rounded-3xl py-6 px-8 text-foreground z-20">
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

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
            <AnimatedFormButton
              type="button"
              variant="outline"
              suppressHoverAnimation
              className="sm:flex-1"
              loading={cancelLoading}
              loadingLabel={
                language === "ar" ? "جارٍ العودة..." : "Leaving..."
              }
              disabled={loading}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                setTouched({ password: false, confirmPassword: false })
                setError("")
                setCancelLoading(true)
                router.push("/Login")
              }}
            >
              {t.cancel}
            </AnimatedFormButton>
            <AnimatedFormButton
              type="submit"
              variant="solid"
              suppressHoverAnimation
              className="sm:flex-1"
              loading={loading}
              loadingLabel={
                language === "ar" ? "جارٍ الحفظ..." : "Saving..."
              }
            >
              {t.saveChanges}
            </AnimatedFormButton>
          </div>
        </form>
      </main>
    </div>
  )
}
