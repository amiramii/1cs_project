"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { useLanguage } from "@/app/_components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loadTeacherAbsenceMyRequests,
  postTeacherAbsenceCreate,
  type TeacherAbsenceRequestRow,
} from "@/lib/checkinClient";
import {
  getTeacherAbsenceSyncStorageKey,
  TEACHER_ABSENCE_SYNC_EVENT,
} from "@/lib/absenceSync";
import { cn } from "@/lib/utils";

const WEEKDAY_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
const WEEKDAY_AR = [
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
  "الأحد",
] as const;

function isoDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(iso: string, isAr: boolean): string {
  const [y, m, day] = iso.split("-").map(Number);
  if (!y || !m || !day) return iso;
  const dt = new Date(Date.UTC(y, m - 1, day));
  return new Intl.DateTimeFormat(isAr ? "ar-DZ" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dt);
}

function statusLabel(status: string, isAr: boolean): string {
  const s = status.trim().toLowerCase();
  if (s === "accepted") return isAr ? "مقبول" : "Accepted";
  if (s === "refused" || s === "rejected") return isAr ? "مرفوض" : "Refused";
  return isAr ? "قيد المراجعة" : "Pending";
}

function statusClasses(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === "accepted") {
    return "border-[#74A7BD] bg-[#EEFAFF] text-[#74A7BD] dark:border-[#74A7BD] dark:bg-[#152A38] dark:text-[#74A7BD]";
  }
  if (s === "refused" || s === "rejected") {
    return "border-[#DF2D3E] bg-[#FFD1D5] text-[#DF2D3E] dark:border-[#E85462] dark:bg-[#3A1A22] dark:text-[#F0707A]";
  }
  return "border-[#C4A820] bg-[#FFF5C3F2] text-[#9A7B0A] dark:border-[#FFD54F]/55 dark:bg-[#3A3420] dark:text-[#FFD54F]";
}

function formatAbsenceDateRange(
  dates: { date?: string }[] | undefined,
  isAr: boolean
): string {
  if (!dates?.length) return "—";
  const sorted = dates
    .map((d) => d.date)
    .filter((d): d is string => typeof d === "string" && d.length > 0)
    .sort();
  if (sorted.length === 0) return "—";
  if (sorted.length === 1) return formatDisplayDate(sorted[0], isAr);
  return `${formatDisplayDate(sorted[0], isAr)} – ${formatDisplayDate(sorted[sorted.length - 1], isAr)}`;
}

function AbsenceDateCalendar({
  isAr,
  selectedIso,
  onSelect,
}: {
  isAr: boolean;
  selectedIso: string | null;
  onSelect: (iso: string) => void;
}) {
  const initial = selectedIso
    ? new Date(`${selectedIso}T12:00:00`)
    : new Date();
  const [viewMonth, setViewMonth] = useState(
    () => new Date(initial.getFullYear(), initial.getMonth(), 1)
  );

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const monthLabel = new Intl.DateTimeFormat(isAr ? "ar-DZ" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(viewMonth);

  const cells = useMemo(() => {
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: (string | null)[] = [];
    for (let i = 0; i < firstDow; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(isoDateOnly(new Date(year, month, d)));
    }
    return out;
  }, [year, month]);

  const weekdays = isAr ? WEEKDAY_AR : WEEKDAY_EN;

  return (
    <div className="w-full max-w-[408px] rounded-xl border border-[#51689A]/25 bg-white p-4 shadow-sm dark:border-[#383F58] dark:bg-[#1A2036]">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          className="rounded-md p-1 text-[#51689A] hover:bg-[#F6F7FE] dark:text-[#9BA8C4] dark:hover:bg-[#242A40]"
          aria-label={isAr ? "الشهر السابق" : "Previous month"}
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </button>
        <p className="text-sm font-semibold text-[#1B2065] dark:text-[#EEF4F7]">
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          className="rounded-md p-1 text-[#51689A] hover:bg-[#F6F7FE] dark:text-[#9BA8C4] dark:hover:bg-[#242A40]"
          aria-label={isAr ? "الشهر التالي" : "Next month"}
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#51689A] dark:text-[#9BA8C4]">
        {weekdays.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((iso, idx) =>
          iso ? (
            <button
              key={`${iso}-${idx}`}
              type="button"
              onClick={() => onSelect(iso)}
              className={cn(
                "flex h-9 w-full items-center justify-center rounded-md text-sm tabular-nums transition-colors",
                selectedIso === iso
                  ? "bg-[#45539D] font-semibold text-white dark:bg-[#45539D]"
                  : "text-[#1B2065] hover:bg-[#F6F7FE] dark:text-[#EEF4F7] dark:hover:bg-[#242A40]"
              )}
            >
              {Number(iso.slice(8, 10))}
            </button>
          ) : (
            <span key={`empty-${idx}`} className="h-9" />
          )
        )}
      </div>
    </div>
  );
}

export default function ProfessorAbsencesView() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [cause, setCause] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [requests, setRequests] = useState<TeacherAbsenceRequestRow[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoadingList(true);
    try {
      const rows = await loadTeacherAbsenceMyRequests();
      setRequests(rows);
    } catch {
      toast.error(
        isAr ? "تعذر تحميل غياباتك." : "Could not load your absence requests."
      );
      setRequests([]);
    } finally {
      setLoadingList(false);
    }
  }, [isAr]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  // Keep professor list in sync with schooling-side deletes/updates.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onFocus = () => {
      void loadRequests();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void loadRequests();
      }
    };
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadRequests();
      }
    }, 10000);
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === getTeacherAbsenceSyncStorageKey()) {
        void loadRequests();
      }
    };
    const onSyncEvent = () => {
      void loadRequests();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    window.addEventListener(TEACHER_ABSENCE_SYNC_EVENT, onSyncEvent);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(TEACHER_ABSENCE_SYNC_EVENT, onSyncEvent);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadRequests]);

  const resetForm = () => {
    setSelectedDate(null);
    setCause("");
    setFile(null);
    setShowCalendar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onPickFile = (f: File | null) => {
    setFile(f);
  };

  const submit = async () => {
    if (!selectedDate) {
      toast.error(isAr ? "اختر تاريخ الغياب." : "Select an absence date.");
      return;
    }
    if (!cause.trim()) {
      toast.error(isAr ? "اذكر سبب الغياب." : "Enter the absence cause.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await postTeacherAbsenceCreate({
        dates: [selectedDate],
        reason: cause.trim(),
        file,
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(
          t.trim() ||
            (isAr ? "تعذر إرسال المبرر." : "Could not send justification.")
        );
      }
      toast.success(
        isAr
          ? "تم إرسال المبرر إلى الشؤون الأكاديمية."
          : "Justification sent to the schooling office."
      );
      resetForm();
      await loadRequests();
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : isAr
            ? "تعذر إرسال المبرر."
            : "Could not send justification.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const sortedRequests = useMemo(
    () =>
      [...requests].sort((a, b) => {
        const ta = a.created_at ? Date.parse(a.created_at) : 0;
        const tb = b.created_at ? Date.parse(b.created_at) : 0;
        return tb - ta;
      }),
    [requests]
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#1B2065] md:text-3xl dark:text-[#EEF4F7]">
          {isAr ? "غياباتك" : "Your Absences"}
        </h1>
        <p className="text-[15px] text-[#51689A] dark:text-[#9BA8C4]">
          {isAr ? "أبلغ عن غياباتك" : "Notify about your absences"}
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[#51689A]/25 bg-white shadow-sm dark:border-[#383F58] dark:bg-[#1A2036]">
        <div className="space-y-6 p-6 sm:p-8">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#1B2065] dark:text-[#EEF4F7]">
              {isAr ? "تاريخ الغياب" : "Absence date"}
            </Label>
            <Input
              readOnly
              value={
                selectedDate
                  ? formatDisplayDate(selectedDate, isAr)
                  : ""
              }
              placeholder={isAr ? "اختر التاريخ" : "Select Date"}
              onFocus={() => setShowCalendar(true)}
              onClick={() => setShowCalendar(true)}
              className="h-11 cursor-pointer rounded-lg border-[#51689A]/30 bg-[#FEF9F9] text-[#1B2065] dark:border-[#383F58] dark:bg-[#141726] dark:text-[#EEF4F7]"
            />
            {showCalendar ? (
              <div className="pt-2">
                <AbsenceDateCalendar
                  isAr={isAr}
                  selectedIso={selectedDate}
                  onSelect={(iso) => {
                    setSelectedDate(iso);
                    setShowCalendar(true);
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#1B2065] dark:text-[#EEF4F7]">
              {isAr ? "سبب الغياب" : "Absence cause"}
            </Label>
            <Input
              value={cause}
              onChange={(e) => setCause(e.target.value)}
              placeholder={
                isAr ? "سبب الغياب…" : "Absence cause..."
              }
              className="h-11 rounded-lg border-[#51689A]/30 bg-[#FEF9F9] dark:border-[#383F58] dark:bg-[#141726] dark:text-[#EEF4F7]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#1B2065] dark:text-[#EEF4F7]">
              {isAr
                ? "إرفاق ملف المبرر (اختياري)"
                : "Add justification file (Optional)"}
            </Label>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) onPickFile(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#51689A]/40 bg-[#FEF9F9]/80 px-4 py-6 transition-colors dark:border-[#383F58] dark:bg-[#141726]/80",
                isDragging && "border-[#74A7BD] bg-[#EEFAFF]/50"
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-lg border border-[#51689A]/30 bg-white dark:border-[#383F58] dark:bg-[#242A40]">
                <Plus className="size-5 text-[#51689A] dark:text-[#9BA8C4]" />
              </span>
              <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
                {file
                  ? file.name
                  : isAr
                    ? "أسقط الملف هنا"
                    : "Drop file"}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept="image/*,.pdf"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-[#51689A]/15 bg-[#F6F7FE]/50 px-6 py-4 dark:border-[#383F58] dark:bg-[#242A40]/40 sm:px-8">
          <Button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="h-11 gap-2 rounded-xl bg-[#51689A] px-6 text-base font-semibold text-white hover:bg-[#51689A]/90"
          >
            <Send className="size-4" />
            {isAr ? "إرسال المبرر" : "Send Justification"}
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#1B2065] dark:text-[#EEF4F7]">
          {isAr ? "طلباتك السابقة" : "Your submitted requests"}
        </h2>

        {loadingList ? (
          <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
            {isAr ? "جاري التحميل…" : "Loading…"}
          </p>
        ) : sortedRequests.length === 0 ? (
          <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
            {isAr ? "لا توجد طلبات غياب بعد." : "No absence requests yet."}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#51689A]/25 bg-white dark:border-[#383F58] dark:bg-[#1A2036]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="bg-[#51689A] text-white dark:bg-[#242A40]">
                    <th className="px-4 py-3 text-start font-semibold">
                      {isAr ? "تاريخ الغياب" : "Absence date"}
                    </th>
                    <th className="px-4 py-3 text-start font-semibold">
                      {isAr ? "السبب" : "Cause"}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      {isAr ? "الحالة" : "Status"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRequests.map((row) => {
                    const status = String(row.status ?? "pending");
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-[#51689A]/10 last:border-b-0 dark:border-[#383F58]"
                      >
                        <td className="px-4 py-3 text-[#51689A] dark:text-[#74A7BD]">
                          {formatAbsenceDateRange(row.dates, isAr)}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-[#1B2065] dark:text-[#EEF4F7]">
                          {row.reason?.trim() || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "inline-flex min-w-[5.5rem] justify-center rounded-full border px-3 py-1 text-xs font-semibold",
                              statusClasses(status)
                            )}
                          >
                            {statusLabel(status, isAr)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
