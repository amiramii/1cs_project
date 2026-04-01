export type Language = "en" | "ar"
export const LANGUAGE_STORAGE_KEY = "preferred_language"
export const RESET_EMAIL_STORAGE_KEY = "reset_email"

/** When false, skip token checks that send users to `/Login` or away from `/Login`. Turn on when routes are ready. */
export const ENABLE_AUTH_REDIRECTS = false

/** Until the API returns a role, treat new sessions as admin. Other roles will use the same paths while routing is open. */
export const DEFAULT_APP_ROLE = "admin" as const

/**
 * Home dashboard URL. Folders like `(admin)` are route groups and do not appear in the path.
 * Later: switch to `/Dashboard/${role}/...` when those segments exist under `app/`.
 */
export function getDashboardHomePath(_role: string = DEFAULT_APP_ROLE) {
  return "/Dashboard"
}

export const EMAIL_REGEX = /^\S+@\S+\.\S+$/
export const PASSWORD_SYMBOL_REGEX = /[()[\]{}|\\`~!@#$%^&*_\-+=;:'",<>./?]/

export function getLoginTexts(language: Language) {
  return {
    email: language === "ar" ? "البريد الإلكتروني" : "E-mail",
    password: language === "ar" ? "كلمة المرور" : "Password",
    title: language === "ar" ? "مرحبا !" : "Welcome Back !",
    login: language === "ar" ? "تسجيل الدخول" : "login",
    remember: language === "ar" ? "تذكرني" : "Remember me",
    forgot: language === "ar" ? "نسيت كلمة المرور؟" : "Forgot Password?",
    emailRequired:
      language === "ar" ? "الرجاء إدخال البريد الإلكتروني" : "Email is required",
    emailInvalid:
      language === "ar"
        ? "البريد الإلكتروني غير صالح"
        : "Enter a valid email address",
    passwordRequired:
      language === "ar" ? "الرجاء إدخال كلمة المرور" : "Password is required",
    passwordComplexity:
      language === "ar"
        ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل، وتحتوي على رقم واحد، حرف صغير واحد، حرف كبير واحد، ورمز خاص واحد."
        : "Password must be at least 8 characters and include at least 1 digit, 1 lowercase letter, 1 uppercase letter, and 1 special character.",
    loginError:
      language === "ar"
        ? "بريد إلكتروني أو كلمة مرور غير صحيحة"
        : "Invalid email or password",
    loginErrorGeneric:
      language === "ar"
        ? "حدث خطأ ما. يرجى المحاولة مرة أخرى."
        : "Something went wrong. Please try again.",
    resetTitle:
      language === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password",
    resetHint:
      language === "ar"
        ? "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين."
        : "Enter your email and we will send a reset link.",
    resetSubmit:
      language === "ar" ? "إرسال الرابط" : "Send Link",
    resetSuccess:
      language === "ar"
        ? "إذا كان البريد موجودا، تم إرسال رابط إعادة التعيين."
        : "If this email exists, a reset link has been sent.",
    confirmPassword:
      language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password",
    confirmPasswordRequired:
      language === "ar"
        ? "الرجاء تأكيد كلمة المرور"
        : "Please confirm your password",
    passwordMismatch:
      language === "ar"
        ? "كلمتا المرور غير متطابقتين"
        : "Passwords do not match",
    saveChanges:
      language === "ar" ? "حفظ التغييرات" : "Save Changes",
    cancel:
      language === "ar" ? "إلغاء" : "Cancel",
    resetFailed:
      language === "ar"
        ? "تعذر إعادة تعيين كلمة المرور"
        : "Failed to reset password",
    autoLoginFailed:
      language === "ar"
        ? "تم تغيير كلمة المرور. قم بتسجيل الدخول يدويا."
        : "Password changed. Please log in manually.",
  }
}

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "en"
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return stored === "ar" ? "ar" : "en"
}

export function setStoredLanguage(language: Language) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
}
