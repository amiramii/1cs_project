"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Play,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/app/_components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getExamById,
  loadExamsToday,
  patchExamAttendance,
  postExamAiSync,
  postExamOpen,
  type AiSyncResponse,
  type ExamSessionDetail,
  type ExamSessionTodayRow,
} from "@/lib/checkinClient";

const STATUS_HEX = {
  present: "#74A7BD",
  absent: "#C71122",
  justified: "#E7CE51",
};

function formatExamSubtitle(exam: ExamSessionTodayRow | ExamSessionDetail, isAr: boolean) {
  const date = exam.date;
  const time = `${String(exam.start_time).slice(0, 5)} – ${String(exam.end_time).slice(0, 5)}`;
  return isAr
    ? `${exam.module_name} · ${date} · ${time} · ${exam.room}`
    : `${exam.module_name} · ${date} · ${time} · ${exam.room}`;
}

export default function ProfessorExamsView() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [loading, setLoading] = useState(true);
  const [todayExams, setTodayExams] = useState<ExamSessionTodayRow[]>([]);
  const [workingExam, setWorkingExam] = useState<ExamSessionDetail | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [aiSyncing, setAiSyncing] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);

  const refreshToday = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await loadExamsToday();
      setTodayExams(rows);
    } catch (e) {
      console.error(e);
      setTodayExams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshToday();
  }, [refreshToday]);

  const openExam = async (examId: number) => {
    setOpeningId(examId);
    try {
      const res = await postExamOpen(examId);
      const text = await res.text();
      if (!res.ok) throw new Error(text || "open failed");
      const detail = JSON.parse(text) as ExamSessionDetail;
      setWorkingExam(detail);
      setTableSearch("");
      toast.success(
        isAr ? "تم فتح الامتحان ومزامنة مسح الوجه." : "Exam opened with face-scan sync."
      );
      await refreshToday();
    } catch (e) {
      console.error(e);
      toast.error(isAr ? "تعذر فتح الامتحان." : "Could not open exam.");
    } finally {
      setOpeningId(null);
    }
  };

  const reloadWorkingExam = async (examId: number) => {
    const res = await getExamById(examId);
    if (!res.ok) return;
    setWorkingExam((await res.json()) as ExamSessionDetail);
  };

  const syncAiAttendance = async () => {
    if (!workingExam) return;
    setAiSyncing(true);
    try {
      const res = await postExamAiSync(workingExam.id);
      const text = await res.text();
      if (!res.ok) throw new Error(text || "AI sync failed");
      let data: AiSyncResponse = {
        status: "success",
        scanned_count: 0,
        marked_present: 0,
        message: "",
      };
      try {
        data = JSON.parse(text) as AiSyncResponse;
      } catch {
        /* defaults */
      }
      toast.success(
        data.message ||
          (isAr
            ? `اكتملت المزامنة: ${data.marked_present} طالب حاضر.`
            : `AI sync complete: ${data.marked_present} students marked present.`)
      );
      await reloadWorkingExam(workingExam.id);
    } catch (e) {
      console.error(e);
      toast.error(
        isAr ? "فشلت مزامنة الحضور بالذكاء الاصطناعي." : "AI attendance sync failed."
      );
    } finally {
      setAiSyncing(false);
    }
  };

  const togglePresence = async (
    rowId: number,
    next: "present" | "absent"
  ) => {
    if (!workingExam) return;
    setStatusBusyId(rowId);
    try {
      const res = await patchExamAttendance(rowId, { status: next });
      if (!res.ok) throw new Error(await res.text());
      setWorkingExam((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attendances: prev.attendances.map((a) =>
            a.id === rowId ? { ...a, status: next } : a
          ),
        };
      });
    } catch (e) {
      console.error(e);
      toast.error(isAr ? "تعذر تحديث الحضور." : "Could not update attendance.");
    } finally {
      setStatusBusyId(null);
    }
  };

  const filteredRows = useMemo(() => {
    const rows = workingExam?.attendances ?? [];
    const q = tableSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.student_name.toLowerCase().includes(q) ||
        r.student_email.toLowerCase().includes(q)
    );
  }, [workingExam, tableSearch]);

  const stats = useMemo(() => {
    const rows = workingExam?.attendances ?? [];
    if (!rows.length) return { present: 0, absent: 0, justified: 0 };
    let p = 0;
    let a = 0;
    let j = 0;
    for (const r of rows) {
      if (r.status === "present") p++;
      else if (r.status === "justified") j++;
      else a++;
    }
    const n = rows.length;
    return {
      present: Math.round((p / n) * 100),
      absent: Math.round((a / n) * 100),
      justified: Math.round((j / n) * 100),
    };
  }, [workingExam]);

  if (workingExam) {
    return (
      <div className="w-full min-w-0 space-y-5">
        <div className="space-y-4 border-b border-border pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-0.5 shrink-0"
                onClick={() => setWorkingExam(null)}
                aria-label={isAr ? "رجوع" : "Back"}
              >
                <ArrowLeft className="size-5 rtl:rotate-180" />
              </Button>
              <div className="min-w-0 space-y-1">
                <h2 className="text-xl font-bold text-foreground">
                  {isAr ? "حضور الامتحان" : "Exam Attendance"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formatExamSubtitle(workingExam, isAr)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg border-2 border-[#51689A]/40 px-4 text-sm text-[#51689A]"
              onClick={() => void syncAiAttendance()}
              disabled={aiSyncing}
            >
              <RefreshCw
                className={cn("size-4 shrink-0", aiSyncing && "animate-spin")}
              />
              {aiSyncing
                ? isAr
                  ? "جارٍ المزامنة…"
                  : "Syncing…"
                : isAr
                  ? "مزامنة مسح الوجه"
                  : "Sync Face Scans"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(["present", "absent", "justified"] as const).map((key) => (
            <div
              key={key}
              className="rounded-xl border border-border bg-card px-4 py-4 text-center shadow-sm"
            >
              <p className="text-2xl font-bold" style={{ color: STATUS_HEX[key] }}>
                {stats[key]}%
              </p>
              <p className="text-sm font-medium" style={{ color: STATUS_HEX[key] }}>
                {key === "present"
                  ? isAr
                    ? "حاضر"
                    : "Present"
                  : key === "absent"
                    ? isAr
                      ? "غائب"
                      : "Absent"
                    : isAr
                      ? "مبرر"
                      : "Justified"}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-foreground">
              {isAr ? "قائمة الطلاب" : "Student list"}
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder={isAr ? "بحث…" : "Search…"}
                className="h-10 ps-10"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-primary text-white-primary">
                  <th className="px-3 py-2 text-start">{isAr ? "الاسم" : "Name"}</th>
                  <th className="px-3 py-2 text-start">{isAr ? "البريد" : "Email"}</th>
                  <th className="px-3 py-2 text-center">{isAr ? "الحضور" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-3 py-2">{row.student_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.student_email}</td>
                    <td className="px-3 py-2 text-center">
                      {row.status === "justified" ? (
                        <span style={{ color: STATUS_HEX.justified }}>
                          {isAr ? "مبرر" : "Justified"}
                        </span>
                      ) : (
                        <div className="flex justify-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={row.status === "present" ? "default" : "outline"}
                            disabled={statusBusyId === row.id}
                            onClick={() => void togglePresence(row.id, "present")}
                          >
                            P
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={row.status === "absent" ? "default" : "outline"}
                            disabled={statusBusyId === row.id}
                            onClick={() => void togglePresence(row.id, "absent")}
                          >
                            A
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          {isAr ? "امتحانات اليوم" : "Today's Exams"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isAr
            ? "افتح الامتحان لمزامنة مسح الوجه تلقائياً، ثم عدّل الحضور يدوياً عند الحاجة."
            : "Open an exam to auto-sync face scans, then adjust attendance manually if needed."}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {isAr ? "جارٍ التحميل…" : "Loading…"}
        </p>
      ) : todayExams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <ClipboardList className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isAr ? "لا توجد امتحانات اليوم." : "No exams scheduled for today."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {todayExams.map((exam) => (
            <div
              key={exam.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-foreground">{exam.module_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatExamSubtitle(exam, isAr)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? `${exam.student_count} طالب`
                    : `${exam.student_count} students`}
                </p>
              </div>
              <Button
                type="button"
                className="shrink-0 bg-[#51689A] text-white-primary hover:bg-[#51689A]/90"
                onClick={() => void openExam(exam.id)}
                disabled={openingId === exam.id}
              >
                <Play className="size-4" />
                {openingId === exam.id
                  ? isAr
                    ? "جارٍ الفتح…"
                    : "Opening…"
                  : isAr
                    ? "فتح الامتحان"
                    : "Open Exam"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
