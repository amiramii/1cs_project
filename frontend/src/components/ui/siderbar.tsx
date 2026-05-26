"use client"

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/app/_components/language-provider";
import {
  type AppSidebarRole,
} from "@/lib/constants";
import SideBarItems  from "../../app/_components/SideBarItems";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronsLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sidebar({
  expanded, 
  setExpanded,
  role,
}:{
  expanded:boolean,
  setExpanded:(v:boolean)=>void,
  role: AppSidebarRole,
}) {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const isAr = language === "ar";
  const sidePositionClass = isRtl ? "md:right-0" : "md:left-0";

  return (
    <aside
      className={`fixed inset-x-0 bottom-0 z-50 h-20 overflow-hidden rounded-t-xl border-t border-[#74A7BD]/20 py-2 shadow-lg md:inset-x-auto md:top-0 md:h-screen md:rounded-t-none md:border-t-0 md:border-e md:border-[#74A7BD]/20 md:py-4 ${sidePositionClass} ${expanded ? "md:w-64" : "md:w-24"} md:translate-x-0 transition-all duration-200 ${
        isRtl
          ? "md:right-0 md:rounded-l-2xl"
          : "md:left-0 md:rounded-r-2xl"
      }`}
    >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-[#74A7BD]/12 via-[#FEF9F9] to-[#F6F7FE]/88" />
          <div className="absolute -end-3 top-2 h-24 w-24 rounded-full bg-fuchsia-200/30 blur-2xl md:top-6 md:h-32 md:w-32" />
          <div className="absolute -start-1 bottom-10 h-20 w-20 rounded-full bg-[#74A7BD]/12 blur-2xl md:bottom-20" />
          <div className="absolute end-1 bottom-1 h-14 w-14 rounded-full bg-sky-200/22 blur-xl md:end-2 md:bottom-2" />
        </div>
        <div className="relative z-10 flex h-full min-h-0 flex-col">
        <div className="hidden items-center justify-center md:flex">
          <Link
            href="/"
            className="relative flex shrink-0 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[hsl(var(--sidebar-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={isAr ? "الصفحة الرئيسية — تشيك ان" : "CheckIn — home"}
          >
            <motion.div
              animate={{ width: expanded ? 140 : 34 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="relative h-[34px] overflow-hidden"
            >
              <motion.div
                animate={{ opacity: expanded ? 1 : 0, scale: expanded ? 1 : 0.94 }}
                transition={{ duration: 0.24, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Image
                  src="/logo_light.svg"
                  alt=""
                  width={140}
                  height={34}
                  className="dark:hidden"
                  priority
                />
                <Image
                  src="/logo.svg"
                  alt=""
                  width={140}
                  height={34}
                  className="hidden dark:block"
                  priority
                />
              </motion.div>
              <motion.div
                animate={{ opacity: expanded ? 0 : 1, scale: expanded ? 0.9 : 1 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Image
                  src="/logoChopped.svg"
                  alt=""
                  width={34}
                  height={34}
                  className="dark:brightness-0 dark:invert"
                />
              </motion.div>
            </motion.div>
          </Link>
      </div>
        <nav className="h-full md:flex md:flex-col md:pt-7">
          <ul className={`flex h-full w-full items-center justify-center gap-5 px-5 pt-2 md:h-auto md:flex-col md:items-stretch md:justify-center md:gap-0  md:pt-0 md:mt-4 
          ${isRtl ? "md:pr-0" : "md:pl-0"}`}>
              <SideBarItems
                expanded={expanded}
                role={role}
              />
          </ul>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden h-auto cursor-pointer rounded-md border-0 !bg-transparent p-2 text-[#1B2065F2] shadow-none hover:!bg-blue-primary/20 focus-visible:ring-0 dark:text-[#FEF9F9] md:absolute md:bottom-8 md:left-3 md:right-3 md:flex md:items-center md:justify-center md:gap-2"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={isAr ? "طي القائمة أو توسيعها" : "Collapse or expand sidebar"}
          >
            <motion.span
              className="inline-flex shrink-0 will-change-transform"
              initial={false}
              animate={{
                rotate: isRtl ? (expanded ? 180 : 0) : expanded ? 0 : 180,
              }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 28,
                mass: 0.65,
              }}
              whileHover={{
                scale: 1.12,
                transition: { type: "spring", stiffness: 500, damping: 18 },
              }}
              whileTap={{ scale: 0.92 }}
              style={{ transformOrigin: "50% 50%" }}
            >
              <ChevronsLeft size={18} className="text-current" strokeWidth={2.25} />
            </motion.span>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.span
                  key="minimize-label"
                  className="text-sm"
                  initial={{ opacity: 0, x: isRtl ? 6 : -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRtl ? 3 : -3 }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 32,
                  }}
                >
                  {isAr ? "طي القائمة" : "Minimize Menu"}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </Button>
        </nav>
        </div>
    </aside>
  );
}