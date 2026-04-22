import MyDropzone from "../DropBox";
import {
  Download,
  SquarePlus,
  GraduationCap,
  UserRoundPen,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAccessToken } from "@/lib/tokenStorage";
import { useLanguage } from "@/app/_components/language-provider";
import StudScheduleList from "@/app/_components/admin/schedules/StudScheduleList";
import ScheduleYearCombobox from "@/app/_components/admin/schedules/ScheduleYearCombobox";

function parseJsonSafe(text: string): unknown {
  const t = text.trim();
  if (!t) return null;
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return null;
  }
}

function formatDocumentUploadError(
  status: number,
  bodyText: string,
  parsed: unknown,
  isArabic: boolean
): string {
  if (parsed && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    const detail = o.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first === "string") return first;
      if (first && typeof first === "object" && "msg" in first) {
        const msg = (first as { msg?: unknown }).msg;
        if (typeof msg === "string" && msg.trim()) return msg;
      }
    }
    for (const key of ["message", "error", "non_field_errors"] as const) {
      const v = o[key];
      if (typeof v === "string" && v.trim()) return v;
      if (Array.isArray(v) && typeof v[0] === "string") return v[0];
    }
  }
  const snippet = bodyText.trim().slice(0, 280);
  if (snippet && snippet !== "{}") return snippet;

  if (status === 403) {
    return isArabic
      ? "رفض الخادم للصلاحية. JWT الحساب يجب أن يكون لدور إداري؛ وضع التطوير في الواجهة لا يغيّر التوكن."
      : "The server denied access. Your JWT must be for a staff role—the dev UI role does not change the API token.";
  }
  if (status === 401) {
    return isArabic
      ? "لم يُقبل التوثيق. سجّل الدخول أو جدّد الجلسة (توكن منتهٍ أو غير مرسل)."
      : "Authentication was not accepted. Sign in again or refresh your session—the token may be missing or expired.";
  }
  return isArabic ? `فشل الرفع (رمز ${status})` : `Upload failed (HTTP ${status})`;
}

function serializeUploadErrorForLog(parsed: unknown, bodyText: string): string {
  if (parsed !== null && typeof parsed === "object") {
    if (Object.keys(parsed as object).length === 0) {
      return bodyText.trim() || "(empty JSON object)";
    }
    try {
      return JSON.stringify(parsed);
    } catch {
      return "(unserializable object)";
    }
  }
  const s = String(parsed ?? bodyText).trim();
  return s || "(empty body)";
}

export type SchedualsVariant = "admin" | "student";

type SchedMidProps = {
  variant?: SchedualsVariant;
  stagedPdf?: File | null;
  onStagedPdfChange?: (file: File | null) => void;
};

export default function SchedulsMiddleContainer({
  variant = "admin",
  stagedPdf = null,
  onStagedPdfChange,
}: SchedMidProps) {
  const [activeTab, setActiveTab] = useState<"professor" | "student">("professor");
  const [year, setYear] = useState("default");
  const [title, setTitle] = useState("");
  const [professorName, setProfessorName] = useState("");
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const router = useRouter();
  const ProfessorSchedulesPath = () => {
    router.push("/Scheduals/Professor-Schedules");
  };
  const StudentSchedulesPath = () => {
    router.push("/Scheduals/Student-Schedules");
  };
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const effectivePdf = stagedPdf ?? droppedFile;

  const stripScheduleExtension = (name: string) =>
    name.replace(/\.(pdf|xlsx|xls|csv)$/i, "").trim();

  useEffect(() => {
    if (!stagedPdf) return;
    setTitle((prev) => {
      if (prev.trim()) return prev;
      const fromName = stripScheduleExtension(stagedPdf.name);
      return fromName || prev;
    });
  }, [stagedPdf]);

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setDroppedFile(file);
      onStagedPdfChange?.(file);
      setTitle((prev) => {
        const trimmed = prev.trim();
        if (trimmed) return prev;
        const fromName = stripScheduleExtension(file.name);
        return fromName || prev;
      });
    },
    [onStagedPdfChange]
  );

  const handleUpload = async () => {
    if (!effectivePdf || !title.trim()) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const token = getAccessToken();
      if (!token?.trim()) {
        const message = isArabic
          ? "لا يوجد توكن دخول. سجّل الدخول ثم أعد محاولة الرفع."
          : "No access token found. Sign in, then try uploading again.";
        setUploadError(message);
        toast.error(message);
        return;
      }

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(
        /\/+$/,
        ""
      );
      const audienceValue = activeTab === "professor" ? "teacher" : "student";
      const formData = new FormData();
      formData.append("title", title);
      formData.append("pdf", effectivePdf);
      formData.append("audience", audienceValue);
      if (activeTab === "student" && year !== "default") {
        formData.append("year", year);
      }
      if (activeTab === "professor" && professorName.trim()) {
        formData.append("professorName", professorName.trim());
      }

      const res = await fetch(`${apiBase}/api/documents/`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (res.ok) {
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 1000);
        setTitle("");
        setProfessorName("");
        setYear("default");
        setDroppedFile(null);
        onStagedPdfChange?.(null);
      } else {
        const bodyText = await res.text();
        const parsed = parseJsonSafe(bodyText);
        const message = formatDocumentUploadError(res.status, bodyText, parsed, isArabic);
        setUploadError(message);
        toast.error(message);
        console.error(
          "Upload failed:",
          res.status,
          serializeUploadErrorForLog(parsed, bodyText)
        );
      }
    } catch (err) {
      const message = isArabic
        ? "تعذّر إكمال الرفع. تحقق من الاتصال بالخادم."
        : "Could not complete upload. Check your connection to the server.";
      setUploadError(message);
      toast.error(message);
      console.error("Error uploading:", err);
    } finally {
      setIsUploading(false);
    }
  };

  if (variant === "student") {
    return (
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <StudScheduleList />
      </div>
    );
  }

  const showAudienceToggle = variant === "admin";

  return (
    <div className="mx-auto w-full min-w-0 max-w-full md:w-11/12 lg:w-9/12 xl:w-8/12 space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mx-auto w-full space-y-5">
          <h1 className="text-center text-xl font-semibold text-foreground sm:text-2xl">
            {isArabic ? "إضافة جدول" : "Add schedule"}
          </h1>

          <p className="text-center text-xs text-muted-foreground sm:text-sm">
            {isArabic
              ? "يمكنك إفلات ملف PDF في أي مكان في الصفحة لتحديده، ثم اضغط «رفع الجدول» لحفظه في قاعدة البيانات."
              : "Drop a PDF anywhere on this page to select it, then click “Upload Schedule” to save it to the database."}
          </p>

          {showAudienceToggle && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  label: isArabic ? "طالب" : "Student",
                  value: "student" as const,
                  icon: <GraduationCap size={18} />,
                },
                {
                  label: isArabic ? "أستاذ" : "Professor",
                  value: "professor" as const,
                  icon: <UserRoundPen size={18} />,
                },
              ].map((option) => (
                <label key={option.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="audience"
                    value={option.value}
                    className="peer sr-only"
                    checked={activeTab === option.value}
                    onChange={() => setActiveTab(option.value)}
                  />
                  <div className="flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background text-foreground transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground hover:bg-accent">
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ScheduleYearCombobox
              value={year}
              onChange={setYear}
              disabled={activeTab === "professor"}
              isArabic={isArabic}
            />
            <Input
              type="text"
              placeholder={isArabic ? "اسم الأستاذ..." : "Professor Name..."}
              value={professorName}
              onChange={(event) => setProfessorName(event.target.value)}
              className="h-11 rounded-md border-border bg-background disabled:cursor-not-allowed disabled:opacity-50"
              disabled={activeTab === "student"}
            />
          </div>

          <Input
            type="text"
            placeholder={isArabic ? "عنوان الجدول..." : "Schedule Title..."}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 rounded-md border-border bg-background"
          />

          <MyDropzone
            onDrop={handleDrop}
            accept={{
              "application/pdf": [".pdf"],
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
              "application/vnd.ms-excel": [".xls"],
              "text/csv": [".csv"],
            }}
            className="group mx-auto flex min-h-36 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-background px-4 transition-colors hover:border-primary hover:bg-accent/30"
          >
            <div className="flex max-w-full items-center gap-2 text-muted-foreground">
              <SquarePlus size={24} className="group-hover:text-primary" />
              <p className="w-full truncate whitespace-nowrap text-center text-sm font-medium">
                {effectivePdf
                  ? effectivePdf.name
                  : isArabic
                    ? "قم بإفلات ملف PDF أو Excel أو اختره"
                    : "Drop or choose a PDF or Excel file"}
              </p>
            </div>
          </MyDropzone>

          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !effectivePdf || !title.trim()}
              className="inline-flex h-10 w-full sm:w-3/5 lg:w-1/2 items-center justify-center gap-2 rounded-md bg-[#51689A] px-4 text-sm font-semibold text-[#FEF9F9] transition-colors hover:bg-[#51689A]/90 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Download size={18} className="shrink-0" aria-hidden />
              {isUploading
                ? isArabic
                  ? "جارٍ الرفع..."
                  : "Uploading..."
                : isArabic
                  ? "رفع الجدول"
                  : "Upload Schedule"}
            </Button>
          </div>
          {uploadError && (
            <p className="text-center text-sm text-destructive" role="alert">
              {uploadError}
            </p>
          )}
          {successMsg && (
            <p className="text-center text-sm text-[#74A7BD]">
              {isArabic ? "تم رفع الجدول بنجاح!" : "Schedule uploaded successfully!"}
            </p>
          )}
        </div>
      </div>

      {variant === "admin" && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Button
            type="button"
            onClick={ProfessorSchedulesPath}
            className="h-auto min-h-16 justify-center gap-2 rounded-lg border border-transparent bg-[#51689A] py-4 text-center text-[#FEF9F9] hover:bg-[#51689A]/90"
          >
            <CalendarCheck className="text-[#FEF9F9]" size={22} />
            {isArabic ? "جداول الأساتذة" : "Professors Schedule"}
          </Button>
          <Button
            type="button"
            onClick={StudentSchedulesPath}
            className="h-auto min-h-16 justify-center gap-2 rounded-lg border border-transparent bg-[#74A7BD] py-4 text-center text-[#FEF9F9] hover:bg-[#74A7BD]/90"
          >
            <CalendarCheck className="text-[#FEF9F9]" size={22} />
            {isArabic ? "جداول الطلاب" : "Students Schedule"}
          </Button>
        </div>
      )}

    </div>
  );
}
