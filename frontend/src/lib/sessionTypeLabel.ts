/** Maps Excel `Session_Type` to a short FR/AR label and badge color. */
export function sessionTypeMeta(
  raw: string,
  isAr: boolean
): { label: string; className: string } {
  const t = raw.trim().toLowerCase()
  if (t.includes("tp")) {
    return {
      label: isAr ? "TP" : "TP",
      className:
        "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-200",
    }
  }
  if (t.includes("td")) {
    return {
      label: isAr ? "TD" : "TD",
      className:
        "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
    }
  }
  if (t.includes("cours") || t.includes("course") || t === "cm") {
    return {
      label: isAr ? "محاضرة" : "Cours",
      className:
        "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200",
    }
  }
  const fallback = raw.trim() || (isAr ? "حصة" : "Class")
  return {
    label: fallback,
    className:
      "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200",
  };
}
