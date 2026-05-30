"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, SquarePlus } from "lucide-react";
import MyDropzone from "./DropBox";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/app/_components/language-provider";
import { uploadCheckinCsv } from "@/lib/checkinClient";
import { notifyAdminCsvUploadSuccess } from "@/lib/adminCsvUploadRefresh";
import type { AdminCsvUploadKind } from "@/lib/adminCsvUploadRefresh";
import {
  countCsvDataRows,
  formatImportElapsedStatus,
  formatRowCountHint,
} from "@/lib/csvImportUi";

type Copy = {
  hint: string;
  submit: string;
  importing: string;
  createdLabel: string;
};

type Props = {
  userType: AdminCsvUploadKind;
  copy: { en: Copy; ar: Copy };
  stagedCsv?: File | null;
  onStagedCsvChange?: (file: File | null) => void;
};

export default function CsvUploadSection({
  userType,
  copy,
  stagedCsv = null,
  onStagedCsvChange,
}: Props) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const t = isArabic ? copy.ar : copy.en;

  const [localFile, setLocalFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const effectiveFile = stagedCsv ?? localFile;
  const rowHint = formatRowCountHint(rowCount, isArabic);

  const setFile = (file: File | null) => {
    setLocalFile(file);
    onStagedCsvChange?.(file);
    setFeedback(null);
    setRowCount(null);
  };

  useEffect(() => {
    if (!effectiveFile) {
      setRowCount(null);
      return;
    }
    let alive = true;
    void countCsvDataRows(effectiveFile).then((n) => {
      if (alive) setRowCount(n);
    });
    return () => {
      alive = false;
    };
  }, [effectiveFile]);

  useEffect(() => {
    if (!uploading) {
      setElapsedSec(0);
      return;
    }
    const id = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [uploading]);

  const handleDrop = (files: File[]) => {
    if (files[0]) setFile(files[0]);
  };

  const submitCsv = useCallback(async () => {
    if (!effectiveFile) {
      setFeedback(
        isArabic
          ? "اسحب ملف CSV إلى الصفحة أو منطقة الإفلات أولاً."
          : "Drag a CSV onto the page or the drop zone first."
      );
      return;
    }
    if (!effectiveFile.name.toLowerCase().endsWith(".csv")) {
      setFeedback(
        isArabic ? "الملف يجب أن يكون بصيغة CSV." : "The file must be a CSV."
      );
      return;
    }

    setUploading(true);
    setFeedback(null);
    setElapsedSec(0);
    try {
      const res = await uploadCheckinCsv(effectiveFile, userType);
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        notifyAdminCsvUploadSuccess(userType);
        const created =
          typeof data.users_created === "number" ? data.users_created : 0;
        let msg =
          created > 0
            ? isArabic
              ? `تم إنشاء ${created} ${t.createdLabel}.`
              : `Created ${created} ${t.createdLabel}.`
            : isArabic
              ? "تمت المعالجة (لا حسابات جديدة — ربما إضافة مواد/شعب لأساتذة موجودين)."
              : "Processed (no new accounts — may have added modules/groups for existing users).";

        if (Array.isArray(data.errors) && data.errors.length > 0) {
          msg += isArabic
            ? ` ${data.errors.length} تنبيه على صفوف.`
            : ` ${data.errors.length} row warning(s).`;
        }
        setFeedback(msg);
        setFile(null);
      } else {
        setFeedback(
          typeof data.error === "string"
            ? data.error
            : isArabic
              ? "فشل الرفع."
              : "Upload failed."
        );
      }
    } catch {
      setFeedback(isArabic ? "خطأ في الشبكة." : "Network error.");
    } finally {
      setUploading(false);
    }
  }, [effectiveFile, isArabic, t.createdLabel, userType]);

  return (
    <section className="mx-auto w-full min-w-0 max-w-full md:w-11/12 lg:w-9/12 xl:w-8/12 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 dark:border-[#383F58] dark:bg-[#1A2036]">
      <div className="mx-auto w-full min-w-0 space-y-4">
        <p className="text-center text-xs text-muted-foreground sm:text-sm">{t.hint}</p>

        {effectiveFile && (
          <div className="space-y-2">
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-center text-sm text-foreground">
              <span className="text-muted-foreground">
                {isArabic ? "الملف المحدد: " : "Selected file: "}
              </span>
              <span className="font-medium">{effectiveFile.name}</span>
            </p>
            {rowHint && (
              <p className="text-center text-xs text-muted-foreground">{rowHint}</p>
            )}
          </div>
        )}

        {uploading && (
          <div
            className="flex items-start gap-3 rounded-lg border border-[#51689A]/35 bg-[#51689A]/8 px-3 py-3 dark:border-[#74A7BD]/35 dark:bg-[#51689A]/15"
            role="status"
            aria-live="polite"
          >
            <Loader2
              className="mt-0.5 size-5 shrink-0 animate-spin text-[#51689A] dark:text-[#74A7BD]"
              aria-hidden
            />
            <div className="min-w-0 space-y-1 text-sm">
              <p className="font-medium text-[#1B2065F2] dark:text-[#EEF4F7]">
                {t.importing}
              </p>
              <p className="text-muted-foreground">
                {formatImportElapsedStatus(elapsedSec, rowCount, isArabic)}
              </p>
              <p className="text-xs text-muted-foreground">
                {isArabic
                  ? "يمكنك الانتظار — القائمة ستُحدَّث تلقائياً عند الانتهاء."
                  : "Please wait — the list below will refresh automatically when finished."}
              </p>
            </div>
          </div>
        )}

        <div className="flex w-full flex-col items-center gap-3 xl:flex-row xl:justify-center">
          <Button
            type="button"
            disabled={uploading}
            onClick={() => void submitCsv()}
            className="h-12 w-full rounded-md bg-[#51689A] text-sm font-semibold text-[#FEF9F9] hover:bg-[#51689A]/90 xl:flex-1"
          >
            {uploading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t.importing}
              </span>
            ) : (
              t.submit
            )}
          </Button>

          <MyDropzone
            onDrop={handleDrop}
            accept={{
              "text/csv": [".csv"],
              "application/vnd.ms-excel": [".csv"],
            }}
            disabled={uploading}
            className="group flex h-12 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border bg-white px-6 transition-all duration-300 hover:border-primary hover:bg-accent/30 xl:flex-1 disabled:pointer-events-none disabled:opacity-50 dark:bg-[#242A40] dark:border-[#383F58]"
          >
            <div className="flex flex-row items-center gap-2">
              <SquarePlus
                size={20}
                className="text-muted-foreground group-hover:text-primary"
              />
              <p className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                {isArabic ? "أو اختر ملف CSV" : "Or choose CSV file"}
              </p>
            </div>
          </MyDropzone>
        </div>

        {feedback && !uploading && (
          <p className="text-center text-sm text-muted-foreground">{feedback}</p>
        )}
      </div>
    </section>
  );
}
