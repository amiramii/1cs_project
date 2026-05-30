'use client'
import React, { useMemo } from 'react'
import { motion } from 'motion/react'
import Image from 'next/image'

interface CirclesBgProps {
  seed?: number
}

/** Deterministic 0–1 from seed (stable across renders; no Math.random). */
function seededUnit(seed: number, channel: number): number {
  const x = Math.sin(seed * 12.9898 + channel * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function CirclesBg({ seed }: CirclesBgProps) {
  const s = seed ?? 1
  const floatDelay = useMemo(() => seededUnit(s, 1) * 5 + s, [s])
  const floatDuration = useMemo(() => 12 + seededUnit(s, 2) * 5, [s])
  const pulseDelay = useMemo(() => seededUnit(s, 3) * 5 + s, [s])
  const pulseRepeatDelay = useMemo(() => seededUnit(s, 4) * 6, [s])

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