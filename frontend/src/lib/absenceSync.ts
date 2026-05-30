const ABSENCE_SYNC_KEY = "chekin:teacher-absence-updated-at"
export const TEACHER_ABSENCE_SYNC_EVENT = "teacher-absence-sync"

export function emitTeacherAbsenceSync(): void {
  if (typeof window === "undefined") return
  const stamp = String(Date.now())
  try {
    localStorage.setItem(ABSENCE_SYNC_KEY, stamp)
  } catch {
    // ignore storage failures (private mode/quota), custom event still works
  }
  window.dispatchEvent(new CustomEvent(TEACHER_ABSENCE_SYNC_EVENT, { detail: stamp }))
}

export function getTeacherAbsenceSyncStorageKey(): string {
  return ABSENCE_SYNC_KEY
}
