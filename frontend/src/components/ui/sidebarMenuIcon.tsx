import type { LucideIcon } from "lucide-react"
import {
  ClipboardClock,
  Calendars,
  CircleCheckBig,
  GraduationCap,
  LayoutDashboard,
  UserRoundPen,
} from "lucide-react"
import type { SidebarIconId } from "@/lib/constants"

const SIDEBAR_ICONS: Record<SidebarIconId, LucideIcon> = {
  dashboard: LayoutDashboard,
  sessions: ClipboardClock,
  students: GraduationCap,
  schedules: Calendars,
  justifications: CircleCheckBig,
  professors: UserRoundPen,
}

type SidebarMenuIconProps = {
  id: SidebarIconId
  size?: number
  className?: string
}

export function SidebarMenuIcon({ id, size = 20, className }: SidebarMenuIconProps) {
  const Icon = SIDEBAR_ICONS[id]
  return <Icon size={size} className={className} aria-hidden />
}
