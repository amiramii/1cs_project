"use client";

import MyDropzone from "../DropBox";
import { SquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/app/_components/language-provider";
import { getApiBaseUrl } from "@/lib/apiBase";
import { getAccessToken } from "@/lib/tokenStorage";
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

  const submitCsvToServer = async () => {
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
      const apiBase = getApiBaseUrl();
      const formData = new FormData();
      formData.append("file", effectiveFile);
      formData.append("user_type", "student");

      const token = getAccessToken();
      const res = await fetch(`${apiBase}/api/upload/`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const created = typeof data.users_created === "number" ? data.users_created : 0;
        setFeedback(
          isArabic
            ? `تمت المعالجة: ${created} مستخدم جديد.`
            : `Processed: ${created} new user(s).`
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
    <section className="mx-auto w-full min-w-0 max-w-full md:w-11/12 lg:w-9/12 xl:w-11/12 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="mx-auto w-full min-w-0 space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">
            {isArabic ? "إدارة الطلاب" : "Students Management"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isArabic
              ? "اسحب ملف CSV إلى أي مكان في الصفحة، ثم اضغط «إضافة طلاب من الملف» للحفظ في قاعدة البيانات."
              : "Drag a CSV anywhere on this page, then click “Import students from file” to save to the database."}
          </p>
        </div>

        {effectiveFile && (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-center text-sm text-foreground">
            <span className="text-muted-foreground">
              {isArabic ? "الملف المحدد: " : "Selected file: "}
            </span>
            <span className="font-medium">{effectiveFile.name}</span>
          </p>
        )}

        <div className="flex flex-col items-center justify-center gap-3 lg:flex-row">
          <Button
            type="button"
            disabled={uploading}
            onClick={submitCsvToServer}
            className="h-12 w-full rounded-md bg-[#74A7BD] text-sm font-semibold text-[#FEF9F9] hover:bg-[#74A7BD]/90 lg:flex-1"
          >
            {uploading
              ? isArabic
                ? "جارٍ الاستيراد..."
                : "Importing..."
              : isArabic
                ? "إضافة طلاب من الملف"
                : "Import students from file"}
          </Button>

          <MyDropzone
            onDrop={handleDrop}
            accept={{ "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] }}
            className="group flex h-12 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border bg-white px-6 transition-all duration-300 hover:border-primary hover:bg-accent/30 lg:flex-1 dark:bg-background"
          >
            <div className="flex flex-row items-center gap-2">
              <SquarePlus size={20} className="text-muted-foreground group-hover:text-primary" />
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
