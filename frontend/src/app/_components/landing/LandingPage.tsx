"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AtSign, ArrowDown, Mail, Phone } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef, useState } from "react"

import LanguageMenu from "@/app/_components/login/LanguageMenu"
import { ModeToggle } from "@/app/_components/ModeToggle"
import { useLanguage } from "@/app/_components/language-provider"
import { Button } from "@/components/ui/button"
import { clearTokens, hasValidAccessToken } from "@/lib/tokenStorage"
import {
  getLandingCopy,
  LANDING_MISSION_IMAGES,
} from "@/app/_components/landing/landingCopy"

const easeOut = [0.22, 1, 0.36, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: easeOut },
  }),
}

const fadeLeft = {
  hidden: { opacity: 0, x: -48 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, delay, ease: easeOut },
  }),
}

const fadeRight = {
  hidden: { opacity: 0, x: 48 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, delay, ease: easeOut },
  }),
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88, rotate: -3 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.7, delay, ease: easeOut },
  }),
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const slideFromLeft = {
  hidden: { opacity: 0, x: -120 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.75, delay, ease: easeOut },
  }),
}

const slideFromRight = {
  hidden: { opacity: 0, x: 120 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.75, delay, ease: easeOut },
  }),
}

const slideFromTop = {
  hidden: { opacity: 0, y: -80 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay, ease: easeOut },
  }),
}

const slideFromBottom = {
  hidden: { opacity: 0, y: 80 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay, ease: easeOut },
  }),
}

/** Each mission card enters from a distinct direction. */
const missionEntrance = [slideFromLeft, slideFromRight, slideFromTop, slideFromBottom]

/** Soft page-wide atmosphere (not flat solid fills). */
function LandingAmbientBg() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FEF9F9] via-[#F6F7FE]/80 to-[#EEF4F7] dark:from-[#141726] dark:via-[#19203A] dark:to-[#111322]" />
      <div className="absolute -left-24 top-[10%] h-72 w-72 rounded-full bg-[#74A7BD]/25 blur-3xl dark:bg-[#74A7BD]/10" />
      <div className="absolute -right-16 top-[35%] h-80 w-80 rounded-full bg-[#51689A]/15 blur-3xl dark:bg-[#51689A]/20" />
      <div className="absolute bottom-[20%] left-[30%] h-64 w-64 rounded-full bg-[#1B2065]/[0.04] blur-2xl dark:bg-[#74A7BD]/[0.07]" />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(116,167,189,0.18) 0%, transparent 55%)",
        }}
      />
    </div>
  )
}

function MissionEclipseSides() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-screen max-w-[100vw] -translate-x-1/2"
    >
      {/* Left — fully inside viewport so nothing is clipped */}
      <motion.div
        className="absolute left-[2vw] top-1/2 z-0 aspect-square w-[min(38vw,420px)] -translate-y-1/2 sm:left-[4vw] lg:left-[max(2vw,calc(50%-720px))]"
        initial={{ opacity: 0, scale: 0.88 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.1, ease: easeOut }}
      >
        <div className="absolute inset-0 rounded-full bg-[#1B2065]/15 blur-3xl dark:bg-[#74A7BD]/20" />
        <motion.div
          className="relative h-full w-full"
          animate={{ scale: [1, 1.06, 1], y: [0, -10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/Ellipse 7.svg"
            alt=""
            fill
            sizes="(max-width:768px) 38vw, 420px"
            className="object-contain drop-shadow-[0_0_48px_rgba(27,32,101,0.5)] dark:drop-shadow-[0_0_64px_rgba(116,167,189,0.45)]"
          />
        </motion.div>
      </motion.div>

      {/* Right — fully inside viewport */}
      <motion.div
        className="absolute right-[2vw] top-1/2 z-0 aspect-square w-[min(38vw,420px)] -translate-y-1/2 sm:right-[4vw] lg:right-[max(2vw,calc(50%-720px))]"
        initial={{ opacity: 0, scale: 0.88 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.1, ease: easeOut, delay: 0.12 }}
      >
        <div className="absolute inset-0 rounded-full bg-[#74A7BD]/25 blur-3xl dark:bg-[#51689A]/25" />
        <motion.div
          className="relative h-full w-full"
          animate={{ scale: [1, 1.06, 1], y: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
        >
          <Image
            src="/Ellipse 7.svg"
            alt=""
            fill
            sizes="(max-width:768px) 38vw, 420px"
            className="object-contain drop-shadow-[0_0_48px_rgba(116,167,189,0.55)] dark:drop-shadow-[0_0_64px_rgba(116,167,189,0.4)]"
          />
        </motion.div>
      </motion.div>
    </div>
  )
}

function LandingHeader({ copy }: { copy: ReturnType<typeof getLandingCopy> }) {
  const router = useRouter()
  const { language, setLanguage } = useLanguage()
  const [loggedIn, setLoggedIn] = useState(() => hasValidAccessToken())

  const links = [
    { href: "#aboutUs", label: copy.nav.about },
    { href: "#missions", label: copy.nav.missions },
    { href: "#whyUs", label: copy.nav.whyUs },
    { href: "#contacts", label: copy.nav.contacts },
  ] as const

  const handleLogout = () => {
    clearTokens()
    setLoggedIn(false)
    router.refresh()
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: easeOut }}
      className="sticky top-0 z-40 border-b border-[#74A7BD]/15 bg-[#FEF9F9]/70 backdrop-blur-xl dark:border-[#51689A]/25 dark:bg-[#141726]/70"
    >
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0 transition-opacity hover:opacity-90">
            <Image
              src="/logo_dark.svg"
              alt="Chekin"
              width={110}
              height={28}
              className="h-7 w-auto sm:h-8 dark:hidden"
              priority
            />
            <Image
              src="/logo.svg"
              alt="Chekin"
              width={110}
              height={28}
              className="hidden h-7 w-auto sm:h-8 dark:block"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
            {links.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.4 }}
                className="text-sm font-medium text-[#51689A] transition-colors hover:text-[#1B2065] dark:text-[#9BA8C4] dark:hover:text-[#EEF4F7]"
              >
                {link.label}
              </motion.a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageMenu language={language} onChange={setLanguage} />
            <ModeToggle />
            {loggedIn ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hidden rounded-full border-[#74A7BD]/40 sm:inline-flex dark:border-[#51689A]/50"
                >
                  <Link href="/Dashboard">{copy.auth.dashboard}</Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleLogout}
                  className="rounded-full bg-[#51689A] px-3 text-white hover:bg-[#1B2065] sm:px-4"
                >
                  {copy.auth.logout}
                </Button>
              </>
            ) : (
              <Button
                asChild
                size="sm"
                className="rounded-full bg-[#74A7BD] px-3 text-white shadow-sm hover:bg-[#5f94ab] sm:px-5"
              >
                <Link href="/Login">{copy.auth.login}</Link>
              </Button>
            )}
          </div>
        </div>

        <nav className="mt-2 flex gap-1 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-full border border-[#74A7BD]/25 bg-white/50 px-3 py-1 text-xs font-medium text-[#51689A] backdrop-blur-sm dark:border-[#51689A]/40 dark:bg-[#1A2036]/60 dark:text-[#C5D0E0]"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </motion.header>
  )
}

function HeroSection({ copy }: { copy: ReturnType<typeof getLandingCopy> }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [0, 80])
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.3])

  const titleWords = copy.hero.title.split(" ")

  return (
    <section
      ref={ref}
      className="relative flex min-h-[min(85vh,760px)] flex-col items-center justify-center overflow-hidden px-4 pb-12 pt-8 text-center sm:px-6 sm:pt-12 lg:px-8"
    >
      <motion.div style={{ y, opacity }} className="relative z-10 mx-auto max-w-3xl">
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.4em" }}
          animate={{ opacity: 1, letterSpacing: "0.2em" }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="text-xs font-semibold uppercase text-[#74A7BD] sm:text-sm"
        >
          {copy.hero.eyebrow}
        </motion.p>

        <h1 className="mt-4 font-montserrat text-3xl font-bold leading-tight text-[#1B2065] dark:text-[#EEF4F7] sm:text-5xl md:text-6xl">
          {titleWords.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.12 + i * 0.08, duration: 0.55, ease: easeOut }}
              className="mr-[0.28em] inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6, ease: easeOut }}
          className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#51689A] dark:text-[#9BA8C4] sm:mt-6 sm:text-lg"
        >
          {copy.hero.body}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.58, duration: 0.5, ease: easeOut }}
          className="mt-8 flex flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-center"
        >
          <Button
            asChild
            className="rounded-full bg-[#74A7BD] px-6 text-white hover:bg-[#5f94ab]"
          >
            <Link href="/Login">{copy.hero.cta}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-[#74A7BD]/40 text-[#1B2065] hover:bg-[#74A7BD]/10 dark:border-[#51689A]/50 dark:text-[#EEF4F7]"
          >
            <a href="#aboutUs">{copy.hero.learn}</a>
          </Button>
        </motion.div>
      </motion.div>

      <motion.a
        href="#aboutUs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-6 z-10 flex flex-col items-center gap-1 text-[#51689A] dark:text-[#9BA8C4]"
        aria-label={copy.hero.scroll}
      >
        <span className="text-xs font-medium">{copy.hero.scroll}</span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="h-5 w-5" />
        </motion.span>
      </motion.a>
    </section>
  )
}

function AboutSection({ copy }: { copy: ReturnType<typeof getLandingCopy> }) {
  return (
    <section
      id="aboutUs"
      className="scroll-mt-28 px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeLeft}
            custom={0}
            className="font-montserrat text-3xl font-bold text-[#1B2065] dark:text-[#EEF4F7] sm:text-4xl lg:text-5xl"
          >
            {copy.about.title}
          </motion.h2>
          <motion.p
            variants={fadeLeft}
            custom={0.08}
            className="mt-3 font-montserrat text-lg font-semibold text-[#51689A] sm:text-xl lg:text-2xl"
          >
            {copy.about.subtitle}
          </motion.p>
          <motion.p
            variants={fadeLeft}
            custom={0.16}
            className="mt-5 text-sm leading-relaxed text-[#1B2065]/90 dark:text-[#C5D0E0] sm:text-base lg:text-lg"
          >
            {copy.about.p1}
          </motion.p>
          <motion.p
            variants={fadeLeft}
            custom={0.24}
            className="mt-4 text-sm leading-relaxed text-[#51689A] sm:text-base lg:text-lg"
          >
            {copy.about.p2}
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={scaleIn}
          custom={0.1}
          className="relative mx-auto w-full max-w-[340px] sm:max-w-md lg:max-w-none"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/aboutUs.svg"
              alt=""
              width={520}
              height={520}
              className="mx-auto h-auto w-full"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function MissionSection({ copy }: { copy: ReturnType<typeof getLandingCopy> }) {
  return (
    <section
      id="missions"
      className="relative scroll-mt-28 overflow-visible px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
    >
      <MissionEclipseSides />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="font-montserrat text-3xl font-bold text-[#1B2065] dark:text-[#EEF4F7] sm:text-4xl lg:text-5xl"
        >
          {copy.mission.title}
        </motion.h2>

        <div className="mt-10 grid gap-10 sm:mt-12 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 lg:gap-x-12">
          {copy.mission.items.map((item, index) => (
            <motion.article
              key={item.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px", amount: 0.25 }}
              variants={missionEntrance[index] ?? slideFromLeft}
              custom={index * 0.08}
              whileHover={{ y: -4 }}
              className="flex flex-col gap-4 rounded-2xl border border-[#74A7BD]/20 bg-white/40 p-4 shadow-sm backdrop-blur-md dark:border-[#51689A]/30 dark:bg-[#1A2036]/40 sm:flex-row sm:items-start sm:p-5"
            >
              <motion.div
                whileHover={{ rotate: [0, -4, 4, 0] }}
                transition={{ duration: 0.45 }}
                className="mx-auto shrink-0 sm:mx-0"
              >
                <Image
                  src={LANDING_MISSION_IMAGES[index]}
                  alt=""
                  width={140}
                  height={140}
                  className="h-28 w-28 object-contain sm:h-36 sm:w-36"
                />
              </motion.div>
              <div className="text-center sm:text-start">
                <h3 className="font-montserrat text-base font-bold text-[#1B2065] dark:text-[#EEF4F7] sm:text-lg lg:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#51689A] dark:text-[#9BA8C4] sm:text-base">
                  {item.body}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhyUsSection({ copy }: { copy: ReturnType<typeof getLandingCopy> }) {
  return (
    <section
      id="whyUs"
      className="scroll-mt-28 px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={scaleIn}
          custom={0}
          className="order-2 flex justify-center lg:order-1"
        >
          <motion.div
            animate={{ rotate: [0, 3, 0, -3, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/vicinity.svg"
              alt="Vicinity"
              width={360}
              height={360}
              className="h-auto w-full max-w-[280px] dark:hidden sm:max-w-[340px] lg:max-w-[360px]"
            />
            <Image
              src="/vicityDark.svg"
              alt="Vicinity"
              width={360}
              height={360}
              className="hidden h-auto w-full max-w-[280px] dark:block sm:max-w-[340px] lg:max-w-[360px]"
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="order-1 lg:order-2"
        >
          <motion.h2
            variants={fadeRight}
            custom={0}
            className="font-montserrat text-3xl font-bold text-[#1B2065] dark:text-[#EEF4F7] sm:text-4xl lg:text-5xl"
          >
            {copy.whyUs.title}
          </motion.h2>
          <motion.p
            variants={fadeRight}
            custom={0.08}
            className="mt-2 font-montserrat text-base font-semibold text-[#74A7BD] sm:text-lg"
          >
            {copy.whyUs.subtitle}
          </motion.p>
          <motion.p
            variants={fadeRight}
            custom={0.14}
            className="mt-5 text-sm leading-relaxed text-[#1B2065]/90 dark:text-[#C5D0E0] sm:text-base lg:text-lg"
          >
            {copy.whyUs.p1}
          </motion.p>
          <motion.p
            variants={fadeRight}
            custom={0.22}
            className="mt-4 text-sm leading-relaxed text-[#51689A] sm:text-base lg:text-lg"
          >
            {copy.whyUs.p2}
          </motion.p>
          <motion.p
            variants={fadeRight}
            custom={0.3}
            className="mt-4 text-sm leading-relaxed text-[#51689A] sm:text-base lg:text-lg"
          >
            {copy.whyUs.p3}
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}

function LandingFooter({ copy }: { copy: ReturnType<typeof getLandingCopy> }) {
  const contacts = [
    { icon: Mail, label: "vicinity@gmail.com", href: "mailto:vicinity@gmail.com" },
    { icon: AtSign, label: "vicinity_app", href: "#contacts" },
    { icon: Phone, label: "0745672912", href: "tel:0745672912" },
  ] as const

  return (
    <footer
      id="contacts"
      className="relative scroll-mt-28 border-t border-[#74A7BD]/30 bg-[#EEF4F7]/80 px-4 py-12 backdrop-blur-md dark:border-[#51689A]/35 dark:bg-[#1A2036]/75 sm:px-6 lg:px-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#74A7BD]/[0.07] via-transparent to-[#51689A]/[0.06] dark:from-[#74A7BD]/10 dark:to-[#51689A]/10"
      />

      <div className="relative z-10 mx-auto max-w-6xl text-[#1B2065] dark:text-[#EEF4F7]">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="font-montserrat text-3xl font-bold sm:text-4xl"
        >
          {copy.contacts.title}
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="mt-10 flex flex-col gap-6 sm:mt-12 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-4 lg:gap-x-14"
        >
          {contacts.map(({ icon: Icon, label, href }, i) => (
            <motion.a
              key={label}
              href={href}
              variants={fadeUp}
              custom={i * 0.1}
              whileHover={{ x: 4 }}
              className="group flex items-center gap-3 text-[#1B2065] hover:text-[#51689A] dark:text-[#EEF4F7] dark:hover:text-[#74A7BD]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#74A7BD]/45 bg-white/80 text-[#51689A] shadow-sm transition-colors group-hover:border-[#74A7BD] group-hover:bg-[#74A7BD]/15 dark:border-[#51689A]/50 dark:bg-[#141726]/80 dark:text-[#74A7BD]">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="font-montserrat text-sm font-medium sm:text-base lg:text-lg">
                {label}
              </span>
            </motion.a>
          ))}
        </motion.div>

        <div className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-[#74A7BD]/20 pt-8 dark:border-[#51689A]/30 sm:flex-row">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Image
              src="/logo_dark.svg"
              alt="Chekin"
              width={100}
              height={26}
              className="h-7 w-auto dark:hidden"
            />
            <Image
              src="/logo_light.svg"
              alt="Chekin"
              width={100}
              height={26}
              className="hidden h-7 w-auto dark:block"
            />
            <p className="font-montserrat text-center text-sm text-[#51689A] sm:text-start dark:text-[#9BA8C4]">
              © {new Date().getFullYear()} {copy.footer}
            </p>
          </div>
          <Button
            asChild
            className="rounded-full bg-[#74A7BD] px-6 font-montserrat text-white hover:bg-[#5f94ab]"
          >
            <Link href="/Login">{copy.auth.signIn}</Link>
          </Button>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  const { language } = useLanguage()
  const copy = getLandingCopy(language)

  return (
    <div className="relative min-h-dvh scroll-smooth font-montserrat text-[#1B2065] dark:text-[#EEF4F7]">
      <LandingAmbientBg />
      <LandingHeader copy={copy} />
      <main className="overflow-visible">
        <HeroSection copy={copy} />
        <AboutSection copy={copy} />
        <MissionSection copy={copy} />
        <WhyUsSection copy={copy} />
      </main>
      <LandingFooter copy={copy} />
    </div>
  )
}
