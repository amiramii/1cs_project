"use client"

import React, { useState, useEffect } from "react"
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
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import EmailInput from "./EmailInput"
import login from "@/lib/auth"
import {
  EMAIL_REGEX,
  PASSWORD_SYMBOL_REGEX,
  getLoginTexts,
  getStoredLanguage,
  setStoredLanguage,
} from "../../../lib/constants"
import SubmitButton from "./SubmitButton"
import LanguageMenu from "./LanguageMenu"
import PasswordInput from "./PasswordInput"

export default function LoginForm() {
  const router = useRouter()

  const [language, setLanguage] = useState<"en" | "ar">(() => getStoredLanguage())
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const [data, setData] = useState({ email: "", password: "" })
  const [apiError, setApiError] = useState("")

  const [touched, setTouched] = useState({ email: false, password: false })

  const { resolvedTheme } = useTheme()
  const t = getLoginTexts(language)

  useEffect(() => {
    setStoredLanguage(language)
  }, [language])

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

  const dir = language === "ar" ? "rtl" : "ltr"
  const logoSrc = resolvedTheme === "dark" ? "/logo.svg" : "/logo_light.svg"

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
    try {
      await login(values.email, values.password, rememberMe)

      const role = "admin"
      router.push(`/Dashboard/${role}/Dashboard`)
    } catch (err) {
      console.error(err)
      setApiError(t.loginErrorGeneric)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-[min(92vw,26rem)] mx-auto gap-3 font-inter relative z-50">
      <header className="z-10 w-full overflow-x-hidden px-1 flex items-center justify-center">
        <Image
          src={logoSrc}
          alt="Chekin"
          width={420}
          height={110}
          className="object-contain w-[68%] h-auto max-h-[10vh]"
          priority
        />
      </header>

      <main
        className="w-full bg-card/80 backdrop-blur-3xl border border-border flex flex-col rounded-3xl py-4 px-5 md:px-6 text-foreground"
        dir={dir}
      >
        <div className="self-end mb-2">
          <LanguageMenu language={language} onChange={setLanguage} />
        </div>

        <form
          id="login-form"
          className="w-full flex flex-col gap-3"
          noValidate
          onSubmit={validatorHandleSubmit((_values: any, _valid: boolean) => {
            const emailErr = getEmailError()
            const passErr = getPasswordError()
            if (emailErr || passErr) {
              setTouched({ email: true, password: true })
              return
            }
            onSubmit({ email: data.email, password: data.password })
          })}
          onReset={handleReset((v: any) => {
            setData({ ...v })
            setApiError("")
          })}
        >
          <FieldGroup>
            <FieldTitle className="text-center text-2xl mb-2 self-center font-montserrat font-semi-bold ">
              {t.title}
            </FieldTitle>

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
                className="text-blue-secondary border-0 border-b text-wrap"
                onClick={() => router.push("/Forgot-password")}
              >
                {t.forgot}
              </Button>
            </div>

            {/* LOGIN */}
            <SubmitButton message={t.login} />
          </FieldGroup>
        </form>
      </main>
    </div>
  )
} 