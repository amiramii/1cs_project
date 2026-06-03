"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useLanguage } from "@/app/_components/language-provider";
import { Button } from "@/components/ui/button";
import {
  loadAllJustificationsReviewQueue,
  patchJustificationAccept,
  patchJustificationRefuse,
} from "@/lib/checkinClient";
import { getScheduleFileFetchUrl } from "@/lib/scheduleMediaUrl";

type RawJustification = {
  id: number;
  student_name?: string;
  student_email?: string;
  status?: string;
  cause?: string;
  absence_type?: string;
  file?: string | null;
  created_at?: string;
  attendances?: { module?: string; date?: string }[];
  exam_attendances?: { module?: string; date?: string }[];
};

function isoDate(dateStr?: string): string {
  if (!dateStr) return "";
  return dateStr.includes("T") ? dateStr.slice(0, 10) : dateStr.slice(0, 10);
}

export default function SchoolJustificationDetailsPanel() {
  const search = useSearchParams();
  const router = useRouter();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const studentEmail = (search.get("student") ?? "").trim().toLowerCase();

  const [rows, setRows] = useState<RawJustification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    if (!studentEmail) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const raw =
        (await loadAllJustificationsReviewQueue()) as RawJustification[];
      const filtered = raw.filter((j) =>
        typeof j.student_email === "string"
          ? j.student_email.trim().toLowerCase() === studentEmail
          : false
      );
      filtered.sort((a, b) =>
        String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
      );
      setRows(filtered);
    } catch {
      toast.error(
        isAr ? "تعذر تحميل المبررات." : "Could not load justification details."
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [studentEmail, isAr]);

  useEffect(() => {
    void load();
  }, [load, nonce]);

  const displayName =
    rows[0]?.student_name ?? (studentEmail !== "" ? studentEmail : "");

  async function respond(
    method: typeof patchJustificationAccept | typeof patchJustificationRefuse,
    id: number,
    note?: string
  ) {
    setBusyId(id);
    try {
      const res =
        method === patchJustificationRefuse
          ? await patchJustificationRefuse(id, note)
          : await method(id);
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        toast.error(
          t.trim().slice(0, 200) || (isAr ? "فشل الطلب." : "Request failed.")
        );
        return;
      }
      toast.success(isAr ? "تم التحديث." : "Updated.");
      setNonce((n) => n + 1);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-6">
      <Button
        type="button"
        variant="ghost"
        className="inline-flex h-10 w-fit items-center gap-2 px-0 text-[#1B2065] dark:text-[#EEF4F7]"
        onClick={() => router.push("/Justifications")}
      >
        <ArrowLeft className="size-4" aria-hidden />
        {isAr ? "رجوع" : "Back"}
      </Button>

      {!studentEmail ? (
        <p className="text-sm text-muted-foreground">
          {isAr
            ? "اختر طالبًا من قائمة الطلبات (رابط القائمة يتضمن البريد)."
            : "Open this screen from the schooling justification list."}
        </p>
      ) : null}

      {studentEmail ? (
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-[#1B2065] dark:text-[#EEF4F7] md:text-2xl">
            {isAr ? "تبريرات الطالب" : "Student justification requests"}
          </h1>
          <p className="text-[15px] text-[#51689A] dark:text-[#9BA8C4]">
            {displayName ? (
              <>
                <span className="font-medium text-[#1B2065] dark:text-[#EEF4F7]">{displayName}</span>
                {" · "}
              </>
            ) : null}
            <span className="tabular-nums">{studentEmail}</span>
          </p>
        </header>
      ) : null}

      {loading ? (
        <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
          {isAr ? "جاري التحميل…" : "Loading…"}
        </p>
      ) : null}

      {!loading && studentEmail && rows.length === 0 ? (
        <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
          {isAr
            ? "لا توجد طلبات لهذا الطالب."
            : "No justification records for this email."}
        </p>
      ) : null}

      <ul className="flex flex-col gap-4">
        {rows.map((row) => {
          const pending = row.status === "pending";
          const fileHref =
            typeof row.file === "string" && row.file.trim()
              ? getScheduleFileFetchUrl(row.file)
              : null;
          return (
            <li
              key={row.id}
              className="rounded-xl border border-[#51689A] dark:border-[#383F58]/25 bg-[#FEF9F9] dark:bg-[#1A2036] p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#51689A] dark:border-[#383F58]/10 pb-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#51689A] dark:text-[#9BA8C4]">
                    #{row.id}{" "}
                    <span className="capitalize">{row.absence_type ?? "—"}</span>
                  </p>
                  <p className="text-sm font-medium text-[#1B2065] dark:text-[#EEF4F7]">
                    {row.status ?? "—"}
                  </p>
                  {typeof row.created_at === "string" ? (
                    <p className="text-xs tabular-nums text-[#51689A] dark:text-[#9BA8C4]">
                      {isoDate(row.created_at)}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!pending || busyId === row.id}
                    className="border-[#74A7BD] dark:border-[#74A7BD]/25 text-[#1B2065] dark:text-[#EEF4F7]"
                    onClick={() => void respond(patchJustificationAccept, row.id)}
                  >
                    {isAr ? "قبول" : "Accept"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!pending || busyId === row.id}
                    className="border-[#DF2D3E]/35 text-[#DF2D3E]"
                    onClick={() => {
                      const note =
                        typeof window !== "undefined"
                          ? window.prompt(
                              isAr
                                ? "سبب الرفض (اختياري):"
                                : "Refusal note (optional):"
                            )
                          : null;
                      if (note === null) return;
                      void respond(patchJustificationRefuse, row.id, note);
                    }}
                  >
                    {isAr ? "رفض" : "Refuse"}
                  </Button>
                </div>
              </div>

              {typeof row.cause === "string" && row.cause.trim() ? (
                <p className="mt-3 text-sm leading-relaxed text-[#1B2065] dark:text-[#EEF4F7]/90">
                  {row.cause}
                </p>
              ) : null}

              {([...(row.attendances ?? []), ...(row.exam_attendances ?? [])]).length > 0 ? (
                <div className="mt-3 text-sm text-[#51689A] dark:text-[#9BA8C4]">
                  <span className="font-semibold text-[#1B2065] dark:text-[#EEF4F7]">
                    {isAr ? "التوقيتات" : "slots"}
                    {": "}
                  </span>
                  {([...(row.attendances ?? []), ...(row.exam_attendances ?? [])]).map((a, i) => (
                    <span key={i}>
                      {i > 0 ? ", " : ""}
                      {a.module ?? "—"}
                      {a.date ? ` (${isoDate(a.date)})` : ""}
                    </span>
                  ))}
                </div>
              ) : null}

              {fileHref ? (
                <p className="mt-2">
                  <Link
                    href={fileHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[#51689A] dark:text-[#9BA8C4] underline decoration-[#51689A]/40 underline-offset-2"
                  >
                    {isAr ? "عرض الملف" : "View file"}
                  </Link>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
