"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/app/_components/language-provider";
import type { AbsenceConfigDto } from "@/lib/checkinClient";
import {
  buildAbsenceConfigPayload,
  fetchAndApplyAbsenceConfigFromApi,
  getModuleExclusionCountMode,
  getModuleExclusionAbsenceLimit,
  getModuleExclusionJustifiedLimit,
  getModuleExclusionUnjustifiedLimit,
  ModuleExclusionCountMode,
  MODULE_EXCLUSION_POLICY_CHANGED_EVENT,
  moduleExclusionPolicyBounds,
  saveAbsenceConfigToApi,
  setModuleExclusionCountMode,
  setModuleExclusionAbsenceLimit,
  setModuleExclusionJustifiedLimit,
  setModuleExclusionUnjustifiedLimit,
} from "@/lib/moduleExclusionPolicy";

export default function ModuleExclusionPolicyCard({
  canEdit,
}: {
  canEdit: boolean;
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [limit, setLimit] = useState(getModuleExclusionAbsenceLimit);
  const [countMode, setCountMode] = useState<ModuleExclusionCountMode>(
    getModuleExclusionCountMode
  );
  const [draft, setDraft] = useState(String(limit));
  const [justifiedLimit, setJustifiedLimit] = useState(
    getModuleExclusionJustifiedLimit
  );
  const [unjustifiedLimit, setUnjustifiedLimit] = useState(
    getModuleExclusionUnjustifiedLimit
  );
  const [justifiedDraft, setJustifiedDraft] = useState(String(justifiedLimit));
  const [unjustifiedDraft, setUnjustifiedDraft] = useState(
    String(unjustifiedLimit)
  );
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const syncFromPolicy = useCallback(() => {
    setLimit(getModuleExclusionAbsenceLimit());
    setCountMode(getModuleExclusionCountMode());
    setJustifiedLimit(getModuleExclusionJustifiedLimit());
    setUnjustifiedLimit(getModuleExclusionUnjustifiedLimit());
  }, []);

  const countingModeLabel =
    countMode === "general"
      ? isAr
        ? "عام: كل الغيابات تحت حد واحد"
        : "General: one limit for all absences"
      : isAr
        ? "تفصيلي: حد للمبرر وحد لغير المبرر"
        : "Split: justified and unjustified limits";

  useEffect(() => {
    setDraft(String(limit));
  }, [limit]);

  useEffect(() => {
    setJustifiedDraft(String(justifiedLimit));
  }, [justifiedLimit]);

  useEffect(() => {
    setUnjustifiedDraft(String(unjustifiedLimit));
  }, [unjustifiedLimit]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setConfigLoading(true);
      await fetchAndApplyAbsenceConfigFromApi();
      if (alive) {
        syncFromPolicy();
        setConfigLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [syncFromPolicy]);

  useEffect(() => {
    const onPolicyChange = () => syncFromPolicy();
    window.addEventListener(MODULE_EXCLUSION_POLICY_CHANGED_EVENT, onPolicyChange);
    window.addEventListener("storage", onPolicyChange);
    return () => {
      window.removeEventListener(
        MODULE_EXCLUSION_POLICY_CHANGED_EVENT,
        onPolicyChange
      );
      window.removeEventListener("storage", onPolicyChange);
    };
  }, [syncFromPolicy]);

  const persistConfig = async (body: AbsenceConfigDto) => {
    setSaving(true);
    try {
      const result = await saveAbsenceConfigToApi(body);
      if (!result) {
        toast.error(
          isAr
            ? "تعذر حفظ السياسة على الخادم."
            : "Could not save policy to the server."
        );
        return false;
      }
      syncFromPolicy();
      if (typeof result.new_exclusions === "number") {
        toast.success(
          isAr
            ? `تم الحفظ. ${result.new_exclusions} استبعاد(ات) محدّثة.`
            : `Saved. ${result.new_exclusions} exclusion(s) updated.`
        );
      } else {
        toast.success(isAr ? "تم حفظ السياسة." : "Policy saved.");
      }
      return true;
    } finally {
      setSaving(false);
    }
  };

  const saveLimit = async () => {
    const raw = Number.parseInt(draft, 10);
    setModuleExclusionAbsenceLimit(raw);
    const body: AbsenceConfigDto = {
      mode: "global",
      global_limit: getModuleExclusionAbsenceLimit(),
      unjustified_limit: null,
      justified_limit: null,
    };
    await persistConfig(body);
  };

  const saveCountMode = async (value: string) => {
    const next = setModuleExclusionCountMode(
      value === "split" ? "split" : "general"
    );
    setCountMode(next);
    await persistConfig(buildAbsenceConfigPayload());
  };

  const saveSplitLimits = async () => {
    const justifiedRaw = Number.parseInt(justifiedDraft, 10);
    const unjustifiedRaw = Number.parseInt(unjustifiedDraft, 10);
    setModuleExclusionJustifiedLimit(justifiedRaw);
    setModuleExclusionUnjustifiedLimit(unjustifiedRaw);
    const body: AbsenceConfigDto = {
      mode: "separate",
      global_limit: null,
      unjustified_limit: getModuleExclusionUnjustifiedLimit(),
      justified_limit: getModuleExclusionJustifiedLimit(),
    };
    await persistConfig(body);
  };

  return (
    <section className="rounded-xl border border-[#51689A]/20 bg-[#FEF9F9] p-4 shadow-sm dark:border-[#383F58] dark:bg-[#1A2036]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#1B2065] dark:text-[#EEF4F7]">
            {isAr
              ? "سياسة الاستبعاد بسبب الغياب"
              : "Absence exclusion policy"}
          </p>
          <p className="text-xs text-[#51689A] dark:text-[#9BA8C4]">
            {configLoading
              ? isAr
                ? "جارٍ التحميل من الخادم…"
                : "Loading from server…"
              : isAr
                ? "يُحدَّث الاستبعاد تلقائيًا عند الحفظ، عند استيراد الطلاب، وعند تسجيل الغيابات."
                : "Exclusions update automatically when you save, import students, or record attendance."}
          </p>
        </div>
        <ShieldAlert className="size-5 shrink-0 text-[#74A7BD]" />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <span className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
          {isAr ? "طريقة الاحتساب" : "Counting mode"}
        </span>
        <DropdownMenu open={modeMenuOpen} onOpenChange={setModeMenuOpen}>
          <DropdownMenuTrigger asChild disabled={!canEdit || configLoading}>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full justify-between rounded-lg border border-[#51689A]/35 bg-[#FEF9F9] px-3 text-sm font-normal text-[#1B2065F2] shadow-sm hover:bg-[#FDFDFF] focus-visible:ring-[#51689A]/40 dark:border-[#383F58] dark:bg-[#1A2036] dark:text-[#EEF4F7] dark:hover:bg-[#242A40]"
            >
              <span className="truncate text-start">{countingModeLabel}</span>
              <ChevronDown className="size-4 shrink-0 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="max-h-72 overflow-y-auto border border-slate-200/40 bg-popover shadow-lg backdrop-blur-xl dark:border-[#383F58] dark:bg-[#242A40]"
          >
            <DropdownMenuItem
              onClick={() => {
                void saveCountMode("general");
                setModeMenuOpen(false);
              }}
            >
              {isAr
                ? "عام: كل الغيابات تحت حد واحد"
                : "General: one limit for all absences"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void saveCountMode("split");
                setModeMenuOpen(false);
              }}
            >
              {isAr
                ? "تفصيلي: حد للمبرر وحد لغير المبرر"
                : "Split: justified and unjustified limits"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {countMode === "general" ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
              {isAr ? "الحد العام" : "General limit"}
            </span>
            <Input
              type="number"
              min={moduleExclusionPolicyBounds.min}
              max={moduleExclusionPolicyBounds.max}
              value={canEdit ? draft : String(limit)}
              onChange={(event) => setDraft(event.target.value)}
              disabled={!canEdit || configLoading}
              className="h-9 w-24 rounded-lg border-[#51689A]/25 bg-white text-center font-semibold text-[#1B2065] dark:border-[#383F58] dark:bg-[#141726] dark:text-[#EEF4F7]"
              aria-label={isAr ? "الحد العام للاستبعاد" : "General exclusion limit"}
            />
            <span className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
              {isAr ? "غيابات" : "absences"}
            </span>
          </div>

          {canEdit ? (
            <Button
              type="button"
              size="sm"
              disabled={saving || configLoading}
              onClick={() => void saveLimit()}
              className="h-9 rounded-lg bg-[#51689A] px-4 text-white hover:bg-[#51689A]/90"
            >
              {saving ? (isAr ? "جارٍ الحفظ…" : "Saving…") : isAr ? "حفظ" : "Save"}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
                {isAr ? "حد الغياب المبرر" : "Justified limit"}
              </span>
              <Input
                type="number"
                min={moduleExclusionPolicyBounds.min}
                max={moduleExclusionPolicyBounds.max}
                value={canEdit ? justifiedDraft : String(justifiedLimit)}
                onChange={(event) => setJustifiedDraft(event.target.value)}
                disabled={!canEdit || configLoading}
                className="h-9 w-24 rounded-lg border-[#51689A]/25 bg-white text-center font-semibold text-[#1B2065] dark:border-[#383F58] dark:bg-[#141726] dark:text-[#EEF4F7]"
                aria-label={isAr ? "حد الغياب المبرر" : "Justified absence limit"}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
                {isAr ? "حد الغياب غير المبرر" : "Unjustified limit"}
              </span>
              <Input
                type="number"
                min={moduleExclusionPolicyBounds.min}
                max={moduleExclusionPolicyBounds.max}
                value={canEdit ? unjustifiedDraft : String(unjustifiedLimit)}
                onChange={(event) => setUnjustifiedDraft(event.target.value)}
                disabled={!canEdit || configLoading}
                className="h-9 w-24 rounded-lg border-[#51689A]/25 bg-white text-center font-semibold text-[#1B2065] dark:border-[#383F58] dark:bg-[#141726] dark:text-[#EEF4F7]"
                aria-label={isAr ? "حد الغياب غير المبرر" : "Unjustified absence limit"}
              />
            </div>
          </div>
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              disabled={saving || configLoading}
              onClick={() => void saveSplitLimits()}
              className="h-9 w-fit rounded-lg bg-[#51689A] px-4 text-white hover:bg-[#51689A]/90"
            >
              {saving
                ? isAr
                  ? "جارٍ الحفظ…"
                  : "Saving…"
                : isAr
                  ? "حفظ الحدود"
                  : "Save limits"}
            </Button>
          ) : null}
        </div>
      )}

    </section>
  );
}
