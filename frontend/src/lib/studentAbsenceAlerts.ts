import {
  getModuleExclusionCountMode,
  getModuleExclusionAbsenceLimit,
  getModuleExclusionJustifiedLimit,
  getModuleExclusionUnjustifiedLimit,
  isStudentExcludedFromAttendanceCounts,
} from "@/lib/moduleExclusionPolicy";
import { pushRoleNotification } from "@/lib/notificationsApi";
import { notifyUser } from "@/lib/utils";

const STORAGE_PREFIX = "chekin:absence-alert:";

function alertStorageKey(moduleName: string, kind: string): string {
  return `${STORAGE_PREFIX}${kind}:${moduleName.trim().toLowerCase()}`;
}

function alreadyNotified(key: string): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(key) === "1";
}

function markNotified(key: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, "1");
}

/**
 * Notifies the student when they are one absence away from module exclusion,
 * or when they have just reached the exclusion threshold.
 */
export function notifyStudentAbsenceRisk(
  modules: { name: string; unjustified: number; justified: number }[],
  isAr: boolean
): void {
  if (typeof window === "undefined" || modules.length === 0) return;

  const limit = getModuleExclusionAbsenceLimit();
  const mode = getModuleExclusionCountMode();
  const justifiedLimit = getModuleExclusionJustifiedLimit();
  const unjustifiedLimit = getModuleExclusionUnjustifiedLimit();

  for (const { name, unjustified, justified } of modules) {
    const moduleName = name.trim();
    if (!moduleName) continue;

    const excluded = isStudentExcludedFromAttendanceCounts(
      { justified, unjustified },
      {
        mode,
        generalLimit: limit,
        justifiedLimit,
        unjustifiedLimit,
      }
    );

    const almost =
      mode === "general"
        ? justified + unjustified === limit - 1 && limit > 1
        : (justified === justifiedLimit - 1 && justifiedLimit > 1) ||
          (unjustified === unjustifiedLimit - 1 && unjustifiedLimit > 1);

    if (!almost && !excluded) continue;

    const kind = excluded ? "excluded" : "almost";
    const storageKey = alertStorageKey(moduleName, kind);
    if (alreadyNotified(storageKey)) continue;
    markNotified(storageKey);

    const title = excluded
      ? isAr
        ? "استبعاد من مادة"
        : "Excluded from module"
      : isAr
        ? "تحذير: غيابك مرتفع"
        : "High absence warning";

    const body = excluded
      ? isAr
        ? mode === "general"
          ? `بلغت الحد العام (${limit}) في «${moduleName}». تواصل مع الشؤون التعليمية إن لزم.`
          : `بلغت حد الاستبعاد في «${moduleName}» (مبرر: ${justified}/${justifiedLimit}، غير مبرر: ${unjustified}/${unjustifiedLimit}).`
        : mode === "general"
          ? `You reached the general limit (${limit}) in “${moduleName}”. Contact the schooling office if needed.`
          : `You reached an exclusion limit in “${moduleName}” (justified: ${justified}/${justifiedLimit}, unjustified: ${unjustified}/${unjustifiedLimit}).`
      : isAr
        ? mode === "general"
          ? `غياب واحد إضافي في «${moduleName}» يعني الاستبعاد من المادة (الحد العام: ${limit}).`
          : `أنت قريب من حد الاستبعاد في «${moduleName}» (مبرر: ${justified}/${justifiedLimit}، غير مبرر: ${unjustified}/${unjustifiedLimit}).`
        : mode === "general"
          ? `One more absence in “${moduleName}” may exclude you from that module (general limit: ${limit}).`
          : `You are close to an exclusion limit in “${moduleName}” (justified: ${justified}/${justifiedLimit}, unjustified: ${unjustified}/${unjustifiedLimit}).`;

    pushRoleNotification({
      audience: ["student"],
      title,
      body,
    });

    void notifyUser({ title, body, tag: storageKey });
  }
}
