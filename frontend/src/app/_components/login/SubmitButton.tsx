import { Field } from "@/components/ui/field"
import React from "react"
import {
  AnimatedFormButton,
  type AnimatedFormButtonVariant,
} from "./AnimatedFormButton"

function SubmitButton({
  message,
  loading = false,
  loadingMessage = "...",
  variant = "solid",
}: {
  message: string
  loading?: boolean
  loadingMessage?: string
  variant?: AnimatedFormButtonVariant
}) {
  return (
    <Field className="w-1/2 self-center">
      <AnimatedFormButton
        type="submit"
        variant={variant}
        loading={loading}
        loadingLabel={loadingMessage}
        className="mb-4"
      >
        {message}
      </AnimatedFormButton>
    </Field>
  )
}

export default SubmitButton
