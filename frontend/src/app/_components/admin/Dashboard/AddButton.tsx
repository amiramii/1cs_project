import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import React from 'react'

function AddButton({
  message,
  loading = false,
  loadingMessage = "...",
}: {
  message: string
  loading?: boolean
  loadingMessage?: string
}) {
  return (
    <Field className="w-1/2 self-center">
              <Button
                type="submit"
                disabled={loading}
                className="w-full mb-4 bg-blue-primary dark:bg-blue-secondary font-montserrat text-lg rounded-full relative flex items-center justify-center group"
              >
                <span className="relative z-10 text-background">
                  {loading ? loadingMessage : message}
                </span>

                <span
                  className="absolute inset-0 z-0 scale-0 group-hover:scale-100
                  origin-center transition-all duration-500 ease-out
                  bg-blue-secondary dark:bg-white-primary rounded-full opacity-0 group-hover:opacity-100
                  shadow-loginLight dark:shadow-loginDark"
                />
              </Button>
            </Field>
  )
}

export default AddButton