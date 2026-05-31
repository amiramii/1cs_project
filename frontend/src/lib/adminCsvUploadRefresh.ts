import { notifyExclusionsRecalculated } from "@/lib/moduleExclusionPolicy"

/** Fired after a successful admin CSV import so lists and totals reload. */
export const ADMIN_CSV_UPLOAD_SUCCESS_EVENT = "checkin:admin-csv-upload-success"

export type AdminCsvUploadKind = "teacher" | "student" | "schooling"

export function notifyAdminCsvUploadSuccess(kind: AdminCsvUploadKind): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent(ADMIN_CSV_UPLOAD_SUCCESS_EVENT, { detail: { kind } })
  )
  if (kind === "student") {
    notifyExclusionsRecalculated()
  }
}

export function subscribeAdminCsvUploadSuccess(
  kind: AdminCsvUploadKind,
  onRefresh: () => void
): () => void {
  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ kind?: AdminCsvUploadKind }>
    if (custom.detail?.kind === kind) onRefresh()
  }
  window.addEventListener(ADMIN_CSV_UPLOAD_SUCCESS_EVENT, handler)
  return () => window.removeEventListener(ADMIN_CSV_UPLOAD_SUCCESS_EVENT, handler)
}
