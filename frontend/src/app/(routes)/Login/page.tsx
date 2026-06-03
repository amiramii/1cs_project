"use client"
import React, { Suspense } from 'react'
import LoginForm from '../../_components/login/LoginForm'
import { ModeToggle } from '../../_components/ModeToggle'
import { useRedirectIfAuthenticated } from '@/lib/useRedirectIfAuthenticated'
import { AuthPageBackground } from '../../_components/login/AuthPageBackground'
import RouteLoadingShell from '@/app/_components/RouteLoadingShell'

function LoginPageContent() {
  const ready = useRedirectIfAuthenticated()
  if (!ready) return <RouteLoadingShell />

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

function Page() {
  return (
    <Suspense fallback={<RouteLoadingShell />}>
      <LoginPageContent />
    </Suspense>
  )
}

export default Page 