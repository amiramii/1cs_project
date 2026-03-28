import React from "react"
import { Mail } from "lucide-react"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type EmailInputProps = {
  label: string
  value: string
  placeholder?: string
  touched: boolean
  error: string
  autoFocus?: boolean
  onBlur: () => void
  onChange: (value: string) => void
  onEnter?: () => void
}

function EmailInput({
  label,
  value,
  placeholder = "you@example.com",
  touched,
  error,
  autoFocus,
  onBlur,
  onChange,
  onEnter,
}: EmailInputProps) {
  return (
    <Field className="gap-1">
      <FieldLabel htmlFor="email">{label}</FieldLabel>

      <div className="relative">
        <Mail
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
            touched && error ? "text-destructive" : "text-muted-foreground"
          )}
        />

        <Input
          id="email"
          type="email"
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-invalid={touched && !!error}
          className={cn(
            "pl-10 border-0 border-b-2 border-border rounded-none transition-all focus-visible:ring-0",
            value.length > 0 && "rounded-md",
            touched && error &&
              "border-destructive text-destructive placeholder:text-destructive"
          )}
          value={value}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) {
              e.preventDefault()
              onEnter()
            }
          }}
        />
      </div>
    </Field>
  )
}

export default EmailInput