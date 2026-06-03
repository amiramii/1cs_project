"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AuthPageBackground } from "@/app/_components/login/AuthPageBackground"
import { ModeToggle } from "@/app/_components/ModeToggle"
import { FieldError, FieldTitle } from "@/components/ui/field"
import LanguageMenu from "@/app/_components/login/LanguageMenu"
import { AnimatedFormButton } from "@/app/_components/login/AnimatedFormButton"
import PasswordInput from "@/app/_components/login/PasswordInput"
import api from "@/lib/api"
import { checkinPath } from "@/lib/checkinApi"
import { getApiBaseUrl } from "@/lib/apiBase"
import login from "@/lib/auth"
import { formatDrfError, summarizeUpstreamError } from "@/lib/drfError"
import {
  PASSWORD_SYMBOL_REGEX,
  RESET_EMAIL_STORAGE_KEY,
  getLoginTexts,
} from "@/lib/constants"
import { useLanguage } from "@/app/_components/language-provider"
import { useRedirectIfAuthenticated } from "@/lib/useRedirectIfAuthenticated"

/** Strip quoted-printable line-break markers from copied terminal links. */
function normalizeResetSegment(raw: string): string {
  const decoded = decodeURIComponent(raw.trim())
  return decoded.replace(/=/g, "")
}

export default function ResetPasswordPage() {
  const ready = useRedirectIfAuthenticated()
  const router = useRouter()
  const routeParams = useParams()
  const uidb64 = normalizeResetSegment(
    typeof routeParams?.uidb64 === "string" ? routeParams.uidb64 : ""
  )
  const token = normalizeResetSegment(
    typeof routeParams?.token === "string" ? routeParams.token : ""
  )
  const { language, setLanguage } = useLanguage()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [touched, setTouched] = useState({ password: false, confirmPassword: false })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const submitLockRef = useRef(false)
  const t = getLoginTexts(language)

  const linkInvalid = !uidb64 || !token

  useEffect(() => {
    if (linkInvalid) {
      setError(t.invalidLink)
    }
  }, [linkInvalid, t.invalidLink])

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

  const goToLoginAfterReset = () => {
    router.push("/Login?reset=success")
  }

  const handleSave = async () => {
    setTouched({ password: true, confirmPassword: true })
    if (passwordError || confirmPasswordError) return

    if (linkInvalid) {
      setError(t.invalidLink)
      return
    }

    if (submitLockRef.current || loading) return
    submitLockRef.current = true

    setError("")
    setSuccess("")
    setLoading(true)
    let leavePageAfterSuccess = false
    try {
      const resetRes = await api(
        checkinPath.resetPassword,
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

      const resetText = await resetRes.text()
      let resetBody: unknown = {}
      try {
        resetBody = resetText ? JSON.parse(resetText) : {}
      } catch {
        resetBody = resetText
      }

      if (!resetRes.ok) {
        const msg = summarizeUpstreamError(
          typeof resetBody === "string" ? resetBody : resetText,
          resetRes.status
        )
        setError(
          formatDrfError(
            resetBody,
            msg || t.resetFailed
          )
        )
        return
      }

      setSuccess(t.resetCompleteSuccess)
      const storedEmail = localStorage.getItem(RESET_EMAIL_STORAGE_KEY)

      if (!storedEmail) {
        leavePageAfterSuccess = true
        window.setTimeout(() => goToLoginAfterReset(), 1200)
        return
      }

      try {
        await login(storedEmail, password, false)
        localStorage.removeItem(RESET_EMAIL_STORAGE_KEY)
        leavePageAfterSuccess = true
        router.push("/Dashboard")
      } catch {
        localStorage.removeItem(RESET_EMAIL_STORAGE_KEY)
        leavePageAfterSuccess = true
        window.setTimeout(() => goToLoginAfterReset(), 1200)
      }
    } catch (e) {
      if (e instanceof TypeError) {
        setError(
          `Cannot reach the server at ${getApiBaseUrl()}. Start Django and try again.`
        )
      } else {
        setError(t.resetFailed)
      }
    } finally {
      if (!leavePageAfterSuccess) {
        submitLockRef.current = false
        setLoading(false)
      }
    }
  }

  if (!ready) return null

  return (
    <div className="bg-background min-h-dvh overflow-hidden relative z-0 flex items-center justify-center p-4 w-full">
      <AuthPageBackground />
      <div className="absolute inset-0 bg-white-primary/0 -z-0" />

      <div className="z-20 absolute top-4 right-4">
        <ModeToggle />
      </div>

      <main className="w-full max-w-md rounded-3xl border border-border bg-card/80 px-5 py-5 text-foreground backdrop-blur-3xl z-20 sm:px-8 sm:py-6">
        <div className="self-end mb-2">
          <LanguageMenu language={language} onChange={setLanguage} />
        </div>

        <FieldTitle className="text-center text-2xl mb-4 self-center font-montserrat font-semi-bold">
          {t.resetTitle}
        </FieldTitle>

        {linkInvalid ? (
          <div className="mb-4 space-y-3 rounded-xl border border-[#DF2D3E]/30 bg-[#FEF2F2] px-4 py-3 text-sm dark:bg-[#3A1A1F]">
            <p className="font-medium text-[#B91C1C] dark:text-[#FCA5A5]">{t.invalidLink}</p>
            <p className="text-muted-foreground">{t.invalidLinkHint}</p>
            <Link
              href="/Forgot-password"
              className="inline-block font-semibold text-[#51689A] underline underline-offset-2"
            >
              {t.requestNewLink}
            </Link>
          </div>
        ) : null}

        <form
          className="w-full flex flex-col gap-4"
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
            disabled={linkInvalid}
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
            disabled={linkInvalid}
          />

          <div className="min-h-[20px]">
            {touched.password && passwordError ? (
              <FieldError>{passwordError}</FieldError>
            ) : touched.confirmPassword && confirmPasswordError ? (
              <FieldError>{confirmPasswordError}</FieldError>
            ) : success ? (
              <p className="text-sm font-medium text-[#15803D] dark:text-[#86EFAC]">
                {success}
              </p>
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
              disabled={linkInvalid}
            >
              {t.saveChanges}
            </AnimatedFormButton>
          </div>
        </form>
      </main>
    </div>
  )
}
