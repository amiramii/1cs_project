"use client"
import React from 'react'
import LoginForm from '../../_components/login/LoginForm'
import { ModeToggle } from '../../_components/ModeToggle'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useRedirectIfAuthenticated } from '@/lib/useRedirectIfAuthenticated'
function Page() {
  const { theme } = useTheme()
  const ready = useRedirectIfAuthenticated()
  if (!ready) return null
  const bgSrc = theme === "dark" ? "/bgD3.svg" : "/bg2H.svg"

  return (
    <div className="bg-background min-h-dvh overflow-hidden relative z-0 flex  items-center justify-center p-4 w-full ">
      <Image
        src={bgSrc}
        alt=""
        fill
        priority
        className="object-cover scale-x-[-1]  -z-10 " 
      />

      <div className="absolute inset-0 bg-white-primary/0  -z-0" />

      <div className="z-20 absolute top-4 right-4">
        <ModeToggle />
      </div>
      <LoginForm />
    </div>
  )
}

export default Page