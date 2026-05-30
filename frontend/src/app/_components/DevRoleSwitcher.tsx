"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  clearDevRoleOverride,
  DEV_APP_ROLE_CHANGED_EVENT,
  getDevRoleOverride,
  setDevRoleOverride,
  type StoredAppRole,
} from "@/lib/tokenStorage"

const ROLES: { id: StoredAppRole; label: string }[] = [
  { id: "admin", label: "Admin" },
  { id: "schooling", label: "Schooling" },
  { id: "prof", label: "Prof" },
  { id: "student", label: "Student" },
]

/** Matches first paint on server and client — avoids hydration mismatch on `style`. */
const INITIAL_PANEL_POS = { x: 16, y: 80 }

function computeViewportPosition(): { x: number; y: number } {
  const approxWidth = Math.min(window.innerWidth - 32, 22 * 16)
  const isMd = window.matchMedia("(min-width: 768px)").matches
  const x = isMd ? window.innerWidth - approxWidth - 24 : 16
  const y = window.innerHeight - 200
  return { x: Math.max(0, x), y: Math.max(0, y) }
}

/**
 * Floating control (npm run dev only) to preview dashboards as another role.
 * API calls still use the real JWT — only navigation/sidebar/page branching changes.
 * Drag the header strip to move the panel; position is clamped to the viewport.
 */
export default function DevRoleSwitcher() {
  const [active, setActive] = useState<StoredAppRole | "jwt">("jwt")
  const [pos, setPos] = useState(INITIAL_PANEL_POS)
  const panelRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const dragOffsetRef = useRef<{ ox: number; oy: number } | null>(null)
  const draggingRef = useRef(false)
  const activePointerIdRef = useRef<number | null>(null)

  useEffect(() => {
    queueMicrotask(() => setPos(computeViewportPosition()))
  }, [])

  useEffect(() => {
    const read = () => {
      const o = getDevRoleOverride()
      setActive(o ?? "jwt")
    }
    read()
    window.addEventListener(DEV_APP_ROLE_CHANGED_EVENT, read)
    return () => window.removeEventListener(DEV_APP_ROLE_CHANGED_EVENT, read)
  }, [])

  const clampPosition = useCallback((x: number, y: number) => {
    const el = panelRef.current
    const w = el?.offsetWidth ?? 320
    const h = el?.offsetHeight ?? 160
    const maxX = Math.max(0, window.innerWidth - w)
    const maxY = Math.max(0, window.innerHeight - h)
    return {
      x: Math.min(Math.max(0, x), maxX),
      y: Math.min(Math.max(0, y), maxY),
    }
  }, [])

  useEffect(() => {
    const onResize = () => {
      setPos((p) => clampPosition(p.x, p.y))
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [clampPosition])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !dragOffsetRef.current) return
      const nx = e.clientX - dragOffsetRef.current.ox
      const ny = e.clientY - dragOffsetRef.current.oy
      setPos(clampPosition(nx, ny))
    }

    const onUp = (_e: PointerEvent) => {
      if (!draggingRef.current) return
      draggingRef.current = false
      dragOffsetRef.current = null
      const handle = dragHandleRef.current
      const pid = activePointerIdRef.current
      activePointerIdRef.current = null
      if (handle && pid != null) {
        try {
          handle.releasePointerCapture(pid)
        } catch {
          /* already released */
        }
      }
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [clampPosition])

  const onHandlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    draggingRef.current = true
    activePointerIdRef.current = e.pointerId
    dragOffsetRef.current = {
      ox: e.clientX - pos.x,
      oy: e.clientY - pos.y,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-[100] max-w-[min(100vw-2rem,22rem)] rounded-xl border border-[#E7CE51]/50 bg-[#FEF9F9]/95 text-xs text-[#1B2065] shadow-lg backdrop-blur-md dark:border-[#51689A]/40 dark:bg-[#182449]/95 dark:text-[#EEF4F7]"
      style={{ left: pos.x, top: pos.y }}
      role="region"
      aria-label="Development role preview"
    >
      <div
        ref={dragHandleRef}
        data-dev-role-drag-handle
        onPointerDown={onHandlePointerDown}
        className="flex cursor-grab select-none items-center gap-2 rounded-t-xl border-b border-[#E7CE51]/40 bg-[#E7CE51]/20 px-2 py-2 active:cursor-grabbing dark:border-[#51689A]/40 dark:bg-[#182449]/80"
        title="Drag to move"
      >
        <GripVertical
          className="size-4 shrink-0 text-[#51689A] dark:text-[#74A7BD]"
          aria-hidden
        />
        <p className="min-w-0 flex-1 font-semibold text-[#1B2065] dark:text-[#FEF9F9]">
          Dev: preview dashboard as
        </p>
      </div>
      <div className="p-3 pt-2">
        <p className="mb-2 text-[11px] leading-snug text-[#51689A] dark:text-[#74A7BD]">
          UI only. API still uses your logged-in token.
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={active === "jwt" ? "default" : "outline"}
            className={
              active === "jwt"
                ? "h-8 bg-[#51689A] text-[#FEF9F9] hover:bg-[#51689A]/90"
                : "h-8 border-[#51689A]/40 text-[#1B2065] dark:text-[#FEF9F9]"
            }
            onClick={() => {
              clearDevRoleOverride()
              setActive("jwt")
            }}
          >
            JWT
          </Button>
          {ROLES.map((r) => (
            <Button
              key={r.id}
              type="button"
              size="sm"
              variant={active === r.id ? "default" : "outline"}
              className={
                active === r.id
                  ? "h-8 bg-[#51689A] text-[#FEF9F9] hover:bg-[#51689A]/90"
                  : "h-8 border-[#51689A]/40 text-[#1B2065] dark:text-[#FEF9F9]"
              }
              onClick={() => {
                setDevRoleOverride(r.id)
                setActive(r.id)
              }}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
