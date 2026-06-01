"use client"
import React from 'react'
import LoginForm from '../../_components/login/LoginForm'
import { ModeToggle } from '../../_components/ModeToggle'
import { useRedirectIfAuthenticated } from '@/lib/useRedirectIfAuthenticated'
import { AuthPageBackground } from '../../_components/login/AuthPageBackground'

function Page() {
  const ready = useRedirectIfAuthenticated()
  if (!ready) return null

  return (
    <div className="bg-background min-h-dvh overflow-x-hidden overflow-y-auto relative z-0 flex items-center justify-center p-4 w-full">
      <AuthPageBackground />

      <div className="absolute inset-0 bg-white-primary/0  -z-0" />

      <div className="z-20 absolute top-4 right-4">
        <ModeToggle />
      </div>
      <LoginForm />
    </div>
  )
}

export default Page 