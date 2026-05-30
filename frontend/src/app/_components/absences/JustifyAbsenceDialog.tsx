"use client";

import { useCallback, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pushClientNotification } from "@/lib/notificationsApi";
import { postJustificationCreate } from "@/lib/checkinClient";
import { cn } from "@/lib/utils";

export type AbsenceDaySelection = {
  id: string;
  dateLabel: string;
  slots: {
    module: string;
    time: string;
    attendanceId?: number;
  }[];
};

const ABSENCE_TYPES = [
  { value: "exam", labelEn: "Exam", labelAr: "امتحان" },
  { value: "tp", labelEn: "TP", labelAr: "TP" },
  { value: "td", labelEn: "TD", labelAr: "TD" },
] as const;

export type AbsenceTypeValue = (typeof ABSENCE_TYPES)[number]["value"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDays: AbsenceDaySelection[];
  isAr: boolean;
  onSubmitted?: () => void;
};

export default function JustifyAbsenceDialog({
  open,
  onOpenChange,
  selectedDays,
  isAr,
  onSubmitted,
}: Props) {
  const router = useRouter();
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [absenceType, setAbsenceType] = useState<AbsenceTypeValue | "">("");
  const [cause, setCause] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = useCallback(() => {
    setAbsenceType("");
    setCause("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleOpen = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onPickFile = (f: File | null) => {
    setFile(f);
  };

  const submit = async () => {
    if (!absenceType) {
      toast.error(isAr ? "اختر نوع الغياب." : "Select the absence type.");
      return;
    }
    if (!cause.trim()) {
      toast.error(isAr ? "اذكر سبب الغياب." : "Enter the absence cause.");
      return;
    }
    if (!file) {
      toast.error(
        isAr ? "أرفق ملف المبرر." : "Upload a justification file."
      );
      return;
    }

    const attendanceIds = [
      ...new Set(
        selectedDays.flatMap((d) =>
          d.slots.map((s) => s.attendanceId).filter((id): id is number => typeof id === "number")
        )
      ),
    ];

    if (attendanceIds.length === 0) {
      toast.error(
        isAr
          ? "لا توجد سجلات غياب مختارة أو الخادم لم يعرِض معرف الحضور. أعد تحميل الصفحة."
          : "No attendance IDs for the selected slots. Reload absences from the server and try again."
      );
      return;
    }

    const typeLabel =
      ABSENCE_TYPES.find((t) => t.value === absenceType)?.[
        isAr ? "labelAr" : "labelEn"
      ] ?? absenceType;
    const dateLabels = selectedDays.map((d) => d.dateLabel);

    setIsSubmitting(true);
    try {
      const res = await postJustificationCreate({
        attendance_ids: attendanceIds,
        absence_type: absenceType,
        cause: cause.trim(),
        file,
      });
      const rawText = await res.text().catch(() => "");
      if (!res.ok) {
        toast.error(
          rawText.trim().slice(0, 280) ||
            (isAr ? "فشل إرسال المبرر." : "Submission failed.")
        );
        return;
      }

      const datesSummary = dateLabels.join(", ");
      pushClientNotification({
        title: isAr ? "طلب مبرر جديد" : "New justification request",
        body: isAr
          ? `طالب: نوع ${typeLabel} — التواريخ: ${datesSummary} — الملف: ${file.name}`
          : `A student submitted an absence justification (${typeLabel}). Dates: ${datesSummary}. File: ${file.name}. Cause: ${cause.trim().slice(0, 120)}${cause.trim().length > 120 ? "…" : ""}`,
      });

      toast.success(
        isAr ? "تم إرسال المبرر إلى الشؤون الأكاديمية." : "Your justification was sent to the schooling office."
      );
      onSubmitted?.();
      handleOpen(false);
      router.push("/Justifications");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        showCloseButton
        className="max-h-[min(90dvh,720px)] overflow-y-auto rounded-2xl border-[#51689A]/20 bg-[#FEF9F9] p-6 shadow-lg sm:max-w-2xl sm:rounded-2xl font-montserrat dark:border-[#383F58] dark:bg-[#1A2036]"
        overlayClassName="bg-[#74A7BDCC] supports-backdrop-filter:backdrop-blur-sm"
      >
        <DialogHeader className="space-y-2 text-start">
          <DialogTitle className="text-xl font-bold text-[#1B2065] dark:text-[#EEF4F7]">
            {isAr ? "مبرّر غيابك" : "Justify Your Absence"}
          </DialogTitle>
          <DialogDescription className="text-[15px] text-[#51689A] dark:text-[#9BA8C4]">
            {isAr
              ? "أكمل تفاصيل طلب التبرير."
              : "Fill in the details for your justification"}
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-type`} className="text-[#1B2065] dark:text-[#EEF4F7]">
                {isAr ? "نوع الغياب" : "Type of absence"}
              </Label>
              <div className="relative w-full">
                
                <Select
                  value={absenceType || undefined}
                  onValueChange={(v) =>
                    setAbsenceType(v as AbsenceTypeValue)
                  }
                >
                  <SelectTrigger
                    id={`${formId}-type`}
                    className="h-10 w-full rounded-xl border border-slate-200/80 bg-[#FEF9F9] ps-4 pe-2 text-sm font-medium text-[#1B2065] shadow-sm data-placeholder:text-[#51689A] dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#EEF4F7] dark:data-placeholder:text-[#9BA8C4]"
                  >
                    <SelectValue
                      placeholder={isAr ? "اختر النوع" : "Select type"}
                    />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    /* Dialog content is z-[100]; default select z-50 stays behind the panel */
                    className="z-[200] min-w-[var(--radix-select-trigger-width)] border border-slate-200/40 bg-popover shadow-lg backdrop-blur-xl dark:border-border/50 dark:bg-popover"
                  >
                    <SelectGroup>
                      <SelectLabel className="px-2 font-semibold text-[#51689A]">
                        {isAr ? "نوع الغياب" : "Absence type"}
                      </SelectLabel>
                      {ABSENCE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {isAr ? t.labelAr : t.labelEn}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${formId}-cause`} className="text-[#1B2065] dark:text-[#EEF4F7]">
                {isAr ? "سبب الغياب" : "Absence cause"}
              </Label>
              <Input
                id={`${formId}-cause`}
                value={cause}
                onChange={(e) => setCause(e.target.value)}
                placeholder={isAr ? "سبب الغياب…" : "Absence cause..."}
                className="h-10 rounded-xl border border-slate-200/80 bg-[#FEF9F9] shadow-sm dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#EEF4F7]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#1B2065] dark:text-[#EEF4F7]">
              {isAr ? "رفع ملف المبرر" : "Upload Justification File"}
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                onPickFile(e.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#51689A]/35 bg-[#FEF9F9]/80 py-10 transition-colors dark:border-[#383F58] dark:bg-[#242A40]/80",
                isDragging && "border-[#74A7BD] bg-[#74A7BD]/10"
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-md border border-[#51689A]/30 bg-[#FEF9F9] shadow-sm dark:border-[#383F58] dark:bg-[#1A2036]">
                <Plus className="size-5 text-[#1B2065] dark:text-[#EEF4F7]" aria-hidden />
              </span>
              <span className="text-sm font-medium text-[#51689A] dark:text-[#9BA8C4]">
                {file
                  ? file.name
                  : isAr
                    ? "إفلات ملف أو انقر للاختيار"
                    : "Drop file"}
              </span>
            </button>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mx-auto flex h-12 min-w-[200px] rounded-xl bg-[#51689A] px-8 text-base font-semibold text-white shadow-md hover:bg-[#1B2065]/90"
          >
            {isSubmitting
              ? isAr
                ? "جاري الإرسال…"
                : "Sending…"
              : isAr
                ? "إرسال المبرر"
                : "Send justification"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
