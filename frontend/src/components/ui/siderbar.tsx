"use client"

import Image from "next/image";
import { useLanguage } from "@/app/_components/language-provider";
import {
  type AppSidebarRole,
} from "@/lib/constants";
import SideBarItems  from "../../app/_components/SideBarItems";
import { motion } from "framer-motion";
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
      className={`fixed inset-x-0 bottom-0 z-50 h-20 overflow-visible rounded-t-xl bg-sidebar py-2 shadow-lg backdrop-blur-md md:inset-x-auto md:top-0 md:h-screen md:rounded-t-none md:py-4 ${sidePositionClass} ${expanded ? "md:w-64" : "md:w-24"} md:translate-x-0 transition-all duration-200 ${
        isRtl
          ? "md:right-0 md:rounded-l-2xl"
          : "md:left-0 md:rounded-r-2xl"
      }`}
    >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-sidebar/95" />
        </div>
        <div className="hidden items-center justify-center md:flex">
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
                alt="Checkin"
                width={140}
                height={34}
                className="dark:hidden"
                priority
              />
              <Image
                src="/logo.svg"
                alt="Checkin"
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
                alt="Checkin"
                width={34}
                height={34}
                className="dark:brightness-0 dark:invert"
              />
            </motion.div>
          </motion.div>
      </div>
        <nav className="h-full md:flex md:flex-col md:pt-7">
          <ul className="flex h-full w-full items-center justify-center gap-5 px-5 pt-2 md:h-auto md:flex-col md:items-stretch md:justify-center md:gap-6 md:px-2 md:pt-0 md:mt-4">
              <SideBarItems
                expanded={expanded}
                role={role}
              />
          </ul>
          <Button
            variant="ghost"
            size="sm"
            className="hidden h-auto cursor-pointer rounded-md p-2 text-sidebar-foreground/80 hover:bg-sidebar-accent md:absolute md:bottom-8 md:left-3 md:right-3 md:flex md:items-center md:justify-center md:gap-2"
            asChild
          >
            <motion.button
              key="minimize"
              type="button"
              animate={{ rotate: expanded ? 0 : 180 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              onClick={() => {
                setExpanded(!expanded)
              }}
            >
              <ChevronsLeft size={18} className="text-current" />
              {expanded && (
                <span className="text-sm">{isAr ? "طي القائمة" : "Minimize Menu"}</span>
              )}
            </motion.button>
          </Button>
        </nav>
    </aside>
  );
}