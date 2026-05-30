/** Fired when the module exclusion absence limit changes (e.g. legacy localStorage). */
export const MODULE_EXCLUSION_POLICY_CHANGED_EVENT =
  "chekin-module-exclusion-policy-changed";

const STORAGE_KEY = "chekin:module-exclusion-absence-limit";
const COUNT_MODE_STORAGE_KEY = "chekin:module-exclusion-count-mode";
const JUSTIFIED_LIMIT_STORAGE_KEY = "chekin:module-exclusion-justified-limit";
const UNJUSTIFIED_LIMIT_STORAGE_KEY =
  "chekin:module-exclusion-unjustified-limit";
const DEFAULT_LIMIT = 5;
const DEFAULT_JUSTIFIED_LIMIT = 5;
const DEFAULT_UNJUSTIFIED_LIMIT = 5;
const MIN_LIMIT = 1;
const MAX_LIMIT = 99;
const DEFAULT_COUNT_MODE = "general";

export type ModuleExclusionCountMode = "general" | "split";

export function getModuleExclusionAbsenceLimit(): number {
  if (typeof window === "undefined") return DEFAULT_LIMIT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "") return DEFAULT_LIMIT;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return DEFAULT_LIMIT;
    return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, n));
  } catch {
    return DEFAULT_LIMIT;
  }
}

export function setModuleExclusionAbsenceLimit(value: number): number {
  const clamped = Math.min(
    MAX_LIMIT,
    Math.max(MIN_LIMIT, Math.trunc(value) || DEFAULT_LIMIT)
  );
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, String(clamped));
    window.dispatchEvent(
      new CustomEvent(MODULE_EXCLUSION_POLICY_CHANGED_EVENT, {
        detail: { limit: clamped },
      })
    );
  }
  return clamped;
}

export function getModuleExclusionCountMode(): ModuleExclusionCountMode {
  if (typeof window === "undefined") return DEFAULT_COUNT_MODE;
  try {
    const raw = localStorage.getItem(COUNT_MODE_STORAGE_KEY);
    if (raw === "split") return "split";
    return "general";
  } catch {
    return DEFAULT_COUNT_MODE;
  }
}

export function setModuleExclusionCountMode(
  value: ModuleExclusionCountMode
): ModuleExclusionCountMode {
  const next = value === "split" ? "split" : "general";
  if (typeof window !== "undefined") {
    localStorage.setItem(COUNT_MODE_STORAGE_KEY, next);
    window.dispatchEvent(
      new CustomEvent(MODULE_EXCLUSION_POLICY_CHANGED_EVENT, {
        detail: { countMode: next },
      })
    );
  }
  return next;
}

export function getModuleExclusionJustifiedLimit(): number {
  if (typeof window === "undefined") return DEFAULT_JUSTIFIED_LIMIT;
  try {
    const raw = localStorage.getItem(JUSTIFIED_LIMIT_STORAGE_KEY);
    if (raw == null || raw === "") return DEFAULT_JUSTIFIED_LIMIT;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return DEFAULT_JUSTIFIED_LIMIT;
    return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, n));
  } catch {
    return DEFAULT_JUSTIFIED_LIMIT;
  }
}

export function setModuleExclusionJustifiedLimit(value: number): number {
  const clamped = Math.min(
    MAX_LIMIT,
    Math.max(MIN_LIMIT, Math.trunc(value) || DEFAULT_JUSTIFIED_LIMIT)
  );
  if (typeof window !== "undefined") {
    localStorage.setItem(JUSTIFIED_LIMIT_STORAGE_KEY, String(clamped));
    window.dispatchEvent(
      new CustomEvent(MODULE_EXCLUSION_POLICY_CHANGED_EVENT, {
        detail: { justifiedLimit: clamped },
      })
    );
  }
  return clamped;
}

export function getModuleExclusionUnjustifiedLimit(): number {
  if (typeof window === "undefined") return DEFAULT_UNJUSTIFIED_LIMIT;
  try {
    const raw = localStorage.getItem(UNJUSTIFIED_LIMIT_STORAGE_KEY);
    if (raw == null || raw === "") return DEFAULT_UNJUSTIFIED_LIMIT;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return DEFAULT_UNJUSTIFIED_LIMIT;
    return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, n));
  } catch {
    return DEFAULT_UNJUSTIFIED_LIMIT;
  }
}

export function setModuleExclusionUnjustifiedLimit(value: number): number {
  const clamped = Math.min(
    MAX_LIMIT,
    Math.max(MIN_LIMIT, Math.trunc(value) || DEFAULT_UNJUSTIFIED_LIMIT)
  );
  if (typeof window !== "undefined") {
    localStorage.setItem(UNJUSTIFIED_LIMIT_STORAGE_KEY, String(clamped));
    window.dispatchEvent(
      new CustomEvent(MODULE_EXCLUSION_POLICY_CHANGED_EVENT, {
        detail: { unjustifiedLimit: clamped },
      })
    );
  }
  return clamped;
}

export function isStudentExcludedFromModule(absenceCount: number): boolean {
  return absenceCount >= getModuleExclusionAbsenceLimit();
}

export function shouldCountAttendanceForExclusion(
  status: string | null | undefined,
  mode = getModuleExclusionCountMode()
): boolean {
  if (mode === "general") return status === "absent" || status === "justified";
  return status === "absent" || status === "justified";
}

export function isStudentExcludedFromAttendanceCounts(
  counts: { justified: number; unjustified: number },
  options?: {
    mode?: ModuleExclusionCountMode;
    generalLimit?: number;
    justifiedLimit?: number;
    unjustifiedLimit?: number;
  }
): boolean {
  const mode = options?.mode ?? getModuleExclusionCountMode();
  if (mode === "general") {
    const limit = options?.generalLimit ?? getModuleExclusionAbsenceLimit();
    return counts.justified + counts.unjustified >= limit;
  }
  const justifiedLimit =
    options?.justifiedLimit ?? getModuleExclusionJustifiedLimit();
  const unjustifiedLimit =
    options?.unjustifiedLimit ?? getModuleExclusionUnjustifiedLimit();
  return (
    counts.justified >= justifiedLimit || counts.unjustified >= unjustifiedLimit
  );
}

export const moduleExclusionPolicyBounds = {
  min: MIN_LIMIT,
  max: MAX_LIMIT,
  default: DEFAULT_LIMIT,
} as const;

/** How serious absence count is relative to the exclusion limit. */
export type AbsenceSeverity = "ok" | "caution" | "warning" | "critical" | "excluded";

export function getAbsenceSeverity(
  absenceCount: number,
  limit = getModuleExclusionAbsenceLimit()
): AbsenceSeverity {
  if (absenceCount >= limit) return "excluded";
  if (absenceCount === limit - 1) return "critical";
  if (absenceCount >= limit - 2) return "warning";
  if (absenceCount >= limit - 3 && limit > 3) return "caution";
  return "ok";
}

export const ABSENCE_SEVERITY_COLORS: Record<AbsenceSeverity, string> = {
  ok: "#74A7BD",
  caution: "#9BB8D4",
  warning: "#E7CE51",
  critical: "#E8943A",
  excluded: "#DF2D3E",
};

export function getAbsenceSeverityColor(
  absenceCount: number,
  limit = getModuleExclusionAbsenceLimit()
): string {
  return ABSENCE_SEVERITY_COLORS[getAbsenceSeverity(absenceCount, limit)];
}
