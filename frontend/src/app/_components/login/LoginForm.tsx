"use client"

import React, { useState, useEffect, useRef } from "react"
import { useValidator } from "@validator.tool/hook"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldTitle,
  FieldContent,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import EmailInput from "./EmailInput"
import login from "@/lib/auth"
import {
  EMAIL_REGEX,
  PASSWORD_SYMBOL_REGEX,
  getDashboardHomePath,
  getLoginTexts,
} from "../../../lib/constants"
import { getCurrentAppRole } from "@/lib/tokenStorage"
import { useLanguage } from "@/app/_components/language-provider"
import SubmitButton from "./SubmitButton"
import LanguageMenu from "./LanguageMenu"
import PasswordInput from "./PasswordInput"

export default function LoginForm() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const resetSuccess = searchParams.get("reset") === "success"

  const { language, setLanguage } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const [data, setData] = useState({ email: "", password: "" })
  const [apiError, setApiError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const [touched, setTouched] = useState({ email: false, password: false })
  const prevPathRef = useRef<string | undefined>(undefined)

  const t = getLoginTexts(language)

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setTouched({ email: false, password: false })
        setApiError("")
      }
    }
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [])

  useEffect(() => {
    const prev = prevPathRef.current
    prevPathRef.current = pathname
    if (pathname === "/Login" && prev !== undefined && prev !== "/Login") {
      queueMicrotask(() => {
        setTouched({ email: false, password: false })
        setApiError("")
      })
    }
  }, [pathname])

  const getEmailError = () => {
    if (!data.email) return t.emailRequired
    if (!EMAIL_REGEX.test(data.email)) return t.emailInvalid
    return ""
  }

  const getPasswordError = () => {
    if (!data.password) return t.passwordRequired
    if (data.password.length < 8) return t.passwordComplexity
    if (!/\d/.test(data.password)) return t.passwordComplexity
    if (!/[a-z]/.test(data.password)) return t.passwordComplexity
    if (!/[A-Z]/.test(data.password)) return t.passwordComplexity
    if (!PASSWORD_SYMBOL_REGEX.test(data.password)) return t.passwordComplexity
    return ""
  }

  const { validator, handleReset, handleSubmit: validatorHandleSubmit } =
    useValidator({
      initValues: data,
      validate: (value, values, field) => {
        const val = typeof value === "string" ? value : String(value ?? "")
        if (field === "email") {
          if (!val) return t.emailRequired
          if (!EMAIL_REGEX.test(val)) return t.emailInvalid
          return ""
        }
        if (field === "password") {
          if (!val) return t.passwordRequired
          if (val.length < 8) return t.passwordComplexity
          if (!/\d/.test(val)) return t.passwordComplexity
          if (!/[a-z]/.test(val)) return t.passwordComplexity
          if (!/[A-Z]/.test(val)) return t.passwordComplexity
          if (!PASSWORD_SYMBOL_REGEX.test(val)) return t.passwordComplexity
          return ""
        }
        return ""
      },
    })

  async function onSubmit(values: { email: string; password: string }) {
    setApiError("")
    setLoginLoading(true)
    try {
      await login(values.email, values.password, rememberMe)

      const role = getCurrentAppRole()
      router.push(role ? getDashboardHomePath(role) : "/Login")
    } catch (err) {
      setApiError(
        err instanceof Error && err.message
          ? err.message
          : t.loginErrorGeneric
      )
      setLoginLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-[min(92vw,26rem)] mx-auto gap-3 font-inter relative z-50">
      <header className="z-10 w-full overflow-x-hidden px-1 flex items-center justify-center">
        <Image
          src="/logo_light.svg"
          alt="Chekin"
          width={420}
          height={110}
          className="object-contain w-[68%] h-auto max-h-[10vh] dark:hidden"
          priority
        />
        <Image
          src="/logo.svg"
          alt="Chekin"
          width={420}
          height={110}
          className="hidden dark:block object-contain w-[68%] h-auto max-h-[10vh]"
          priority
        />
      </header>

      <main className="w-full bg-card/80 backdrop-blur-3xl  flex flex-col rounded-3xl py-4 px-5 md:px-6 text-foreground shadow-lg">
        <div className="self-end mb-2">
          <LanguageMenu language={language} onChange={setLanguage} />
        </div>

        <form
          id="login-form"
          className="w-full flex flex-col gap-3"
          noValidate
          onSubmit={validatorHandleSubmit((_values: unknown, _valid: boolean) => {
            const emailErr = getEmailError()
            const passErr = getPasswordError()
            if (emailErr || passErr) {
              setTouched({ email: true, password: true })
              return
            }
            onSubmit({ email: data.email, password: data.password })
          })}
          onReset={handleReset((v) => {
            setData({
              email: typeof v.email === "string" ? v.email : "",
              password: typeof v.password === "string" ? v.password : "",
            })
            setApiError("")
          })}
        >
          <FieldGroup>
            <FieldTitle className="text-center text-2xl mb-2 self-center font-montserrat font-semi-bold ">
              {t.title}
            </FieldTitle>

            {resetSuccess ? (
              <p
                role="status"
                className="mb-1 rounded-lg border border-[#16A34A]/35 bg-[#F0FDF4] px-3 py-2 text-center text-sm text-[#15803D] dark:border-[#22C55E]/30 dark:bg-[#14291A] dark:text-[#86EFAC]"
              >
                {t.resetCompleteSuccess}
              </p>
            ) : null}

            {/* EMAIL */}
            <EmailInput
              label={t.email}
              value={data.email}
              touched={touched.email}
              error={getEmailError()}
              autoFocus
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              onChange={(val) => setData((prev) => ({ ...prev, email: val }))}
              onEnter={() => {
                setTouched((prev) => ({ ...prev, email: true }))
                setTimeout(() => {
                  document.getElementById("password")?.focus()
                }, 0)
              }}
            />
            <div className="min-h-[20px]">
              {touched.email && getEmailError() && (
                <FieldError className="text-destructive">
                  {getEmailError()}
                </FieldError>
              )}
            </div>

            {/* PASSWORD */}
            <PasswordInput
              id="password"
              label={t.password}
              value={data.password}
              touched={touched.password}
              error={getPasswordError()}
              showPassword={showPassword}
              placeholder={language === "ar" ? "أدخل كلمة المرور" : "Enter your password"}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              onChange={(val) => setData((prev) => ({ ...prev, password: val }))}
              onToggleShow={() => setShowPassword((prev) => !prev)}
              onEnter={() => {
                setTouched((prev) => ({ ...prev, password: true }))
                const form = document.getElementById("login-form")
                form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
              }}
            />

            <div className="min-h-[20px]">
              {touched.password && getPasswordError() ? (
                <FieldError>{getPasswordError()}</FieldError>
              ) : apiError ? (
                <FieldError>{apiError}</FieldError>
              ) : null}
            </div>

            {/* REMEMBER + FORGOT */}
            <div className="flex justify-between items-center mt-1 ">
              <Field orientation="horizontal">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <FieldContent>
                  <FieldLabel
                    htmlFor="remember"
                    className="text-[0.8rem] md:text-sm"
                  >
                    {t.remember}
                  </FieldLabel>
                </FieldContent>
              </Field>

              <Button
                type="button"
                variant="link"
                size="sm"
                className="dark:text-blue-secondary text-white-primary border-0 border-b text-wrap"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => {
                  setTouched({ email: false, password: false })
                  setApiError("")
                  router.push("/Forgot-password")
                }}
              >
                {t.forgot}
              </Button>
            </div>

            {/* LOGIN */}
            <SubmitButton
              message={t.login}
              variant="login"
              loading={loginLoading}
              loadingMessage={
                language === "ar"
                  ? "جارٍ تسجيل الدخول..."
                  : "Signing in..."
              }
            />
          </FieldGroup>
        </form>
      </main>
    </div>
  )
} 