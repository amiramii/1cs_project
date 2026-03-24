"use client"

import React from "react"
import { Eye, EyeClosed, Key } from "lucide-react"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PasswordInputProps = {
  id: string
  label: string
  value: string
  touched: boolean
  error: string
  showPassword: boolean
  placeholder: string
  onBlur: () => void
  onChange: (value: string) => void
  onToggleShow: () => void
  onEnter?: () => void
}

export default function PasswordInput({
  id,
  label,
  value,
  touched,
  error,
  showPassword,
  placeholder,
  onBlur,
  onChange,
  onToggleShow,
  onEnter,
}: PasswordInputProps) {
  return (
    <Field className="gap-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      <div className="relative">
        <Key
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
            touched && error ? "text-destructive" : "text-muted-foreground"
          )}
        />

        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          aria-invalid={touched && !!error}
          className={cn(
            "pl-10 pr-10 border-0 border-b-2 border-border rounded-none transition-all focus-visible:ring-0",
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

        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
          onClick={onToggleShow}
        >
          {showPassword ? (
            <Eye className="w-4 h-4 text-muted-foreground" />
          ) : (
            <EyeClosed className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
    </Field>
  )
}
