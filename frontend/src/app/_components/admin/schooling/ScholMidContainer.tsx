"use client";

import MyDropzone from "../DropBox";
import { SquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/app/_components/language-provider";
import { uploadCheckinCsv } from "@/lib/checkinClient";
import { useState } from "react";

type Props = {
  stagedCsv?: File | null;
  onStagedCsvChange?: (file: File | null) => void;
};

export default function MiddleContainer({
  stagedCsv = null,
  onStagedCsvChange,
}: Props) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const effectiveFile = stagedCsv ?? localFile;

  const setFile = (file: File | null) => {
    setLocalFile(file);
    onStagedCsvChange?.(file);
    setFeedback(null);
  };

  const handleDrop = (files: File[]) => {
    if (files[0]) setFile(files[0]);
  };

  const submitSchoolingsCsv = async () => {
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
    try {
      const res = await uploadCheckinCsv(effectiveFile, "schooling");

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const created = typeof data.users_created === "number" ? data.users_created : 0;
        setFeedback(
          isArabic
            ? `تمت المعالجة: ${created} حساب طاقم تعليم جديد.`
            : `Processed: ${created} schooling account(s) created.`
        );
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          setFeedback(
            (isArabic
              ? `تمت المعالجة مع تنبيهات (${data.errors.length}).`
              : `Completed with ${data.errors.length} row warning(s).`) +
              (created ? ` ${created} created.` : "")
          );
        }
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
  };

  return (
    <section className="mx-auto w-full min-w-0 max-w-full md:w-11/12 lg:w-9/12 xl:w-8/12 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="mx-auto w-full min-w-0 space-y-4">
        <p className="text-center text-xs text-muted-foreground sm:text-sm">
          {isArabic
            ? "اسحب ملف CSV في أي مكان في الصفحة لتحديده، ثم اضغط «إضافة طاقم تعليم» لاستيراد طاقم التعليم إلى قاعدة البيانات."
            : "Drop a CSV anywhere on this page to select it, then click “Add Schooling” to import schoolings into the database."}
        </p>

        {effectiveFile && (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-center text-sm text-foreground">
            <span className="text-muted-foreground">
              {isArabic ? "الملف المحدد: " : "Selected file: "}
            </span>
            <span className="font-medium">{effectiveFile.name}</span>
          </p>
        )}

        <div className="flex w-full flex-col items-center gap-3 xl:flex-row xl:justify-center">
          <Button
            type="button"
            disabled={uploading}
            onClick={submitSchoolingsCsv}
            className="h-12 w-full rounded-md bg-[#51689A] text-sm font-semibold text-[#FEF9F9] hover:bg-[#51689A]/90 xl:flex-1"
          >
            {uploading
              ? isArabic
                ? "جارٍ الاستيراد..."
                : "Importing..."
              : isArabic
                ? "إضافة طاقم تعليم"
                : "Add Schooling"}
          </Button>

          <MyDropzone
            onDrop={handleDrop}
            accept={{
              "text/csv": [".csv"],
              "application/vnd.ms-excel": [".csv"],
            }}
            className="group flex h-12 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border bg-white px-6 transition-all duration-300 hover:border-primary hover:bg-accent/30 xl:flex-1 dark:bg-background"
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

        {feedback && (
          <p className="text-center text-sm text-muted-foreground">{feedback}</p>
        )}
      </div>
    </section>
  );
}
