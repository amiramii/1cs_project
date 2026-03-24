'use client'
import React, { useMemo } from 'react'
import { motion } from 'motion/react'
import Image from 'next/image'

interface CirclesBgProps {
  seed?: number
}

function CirclesBg({ seed }: CirclesBgProps) {
  const floatDelay = useMemo(() => (Math.random() * 5) + (seed || 0), [seed])
  const floatDuration = useMemo(() => 12 + Math.random() * 5, [])

  const pulseDelay = useMemo(() => (Math.random() * 5) + (seed || 0), [seed])
  const pulseRepeatDelay = useMemo(() => Math.random() * 6, [])

  return (
    <motion.div
      className="pointer-events-none w-[clamp(300px,35vw,500px)] aspect-square relative transition-all duration-300 ease-out -z-0"
      animate={{
        y: [0, -20, 0], // floating
      }}
      transition={{
        duration: floatDuration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: floatDelay,
      }}
    >
      {/* Main circle image */}
      <Image
        src="/circle_bg.svg"
        alt="Login background circles"
        width={653}
        height={622}
        className="relative object-contain w-full h-full blur-[0.5px] brightness-90 opacity-60 dark:brightness-50 dark:opacity-40 drop-shadow-xl z-10 hidden dark:block"
        priority
      />
      <Image
        src="/CircleLight.svg"
        alt="Login background circles"
        width={653}
        height={622}
        className="relative object-contain w-full h-full blur-[0.5px] brightness-90 opacity-60 dark:brightness-50 dark:opacity-40 drop-shadow-xl z-10 block dark:hidden"
        priority
      />

      {/* Pulsing overlay */}
      <motion.div
        className="absolute inset-0 rounded-full bg-foreground/60 dark:bg-foreground/5 blur-3xl z-0"
        variants={{
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: [0, 0.6, 0], scale: [0.8, 1.2, 0.8] },
        }}
        animate="animate"
        initial="initial"
        transition={{
          duration: 4,
          delay: pulseDelay,
          repeat: Infinity,
          repeatDelay: pulseRepeatDelay,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}

export default CirclesBg