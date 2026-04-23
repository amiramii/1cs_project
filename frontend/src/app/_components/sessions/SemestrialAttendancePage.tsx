"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpFromLine,
  FileText,
  Search,
  Star,
  Users,
  X,
} from "lucide-react";
import { useLanguage } from "@/app/_components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AssignmentApi, AttendanceRow, SessionApi } from "@/lib/professorSessionData";
import { loadProfessorSessionData } from "@/lib/professorSessionData";
import dayjs from "dayjs";
import { currentAcademicStartYear, semesterBounds } from "@/lib/semesterAcademic";
import {
  buildSessionHistoryMatrix,
  distributionFromMatrixRows,
  overallStatusDistributionPct,
  shortDateHeader,
} from "@/lib/sessionHistoryMatrix";
import { isDemoSemestrialMatrix, buildSemestrialDemoMatrix } from "@/lib/semestrialDemoData";
import {
  buildDemoTeacherAssignments,
  isDemoTeacherAssignmentId,
  isDemoTeacherAssignmentsEnabled,
} from "@/app/_components/sessions/profSessionMock";
import { cn } from "@/lib/utils";

const STATUS_HEX = {
  present: "#74A7BD",
  absent: "#C71122",
  justified: "#E7CE51",
} as const;

const SHEET_PAGE = 10;

type AttendanceStatus = "present" | "absent" | "justified";

function StatusCell({
  s,
  isAr,
}: {
  s: AttendanceStatus | null;
  isAr: boolean;
}) {
  if (s == null) {
    return <span className="text-xs text-[#B0B8CC]">—</span>;
  }
  const label =
    s === "present"
      ? isAr
        ? "ح"
        : "P"
      : s === "absent"
        ? isAr
          ? "غ"
          : "A"
        : isAr
          ? "م"
          : "J";
  return (
    <span
      className="inline-flex min-w-[1.4rem] justify-center rounded-md px-1.5 py-0.5 text-xs font-bold text-white"
      style={{ backgroundColor: STATUS_HEX[s] }}
    >
      {label}
    </span>
  );
}

function userIdFromEmail(email: string | undefined) {
  if (!email) return "—";
  return email.split("@")[0] || "—";
}

function englishOrdinalDay(d: number): string {
  const j = d % 10;
  const k = d % 100;
  if (k >= 11 && k <= 13) return `${d}th`;
  if (j === 1) return `${d}st`;
  if (j === 2) return `${d}nd`;
  if (j === 3) return `${d}rd`;
  return `${d}th`;
}

function formatSessionPillLabel(
  s: SessionApi,
  _locale: string,
  isAr: boolean
): string {
  const rawT = s.start_time || "12:00:00";
  const t =
    rawT.length >= 8 ? rawT : rawT.length === 5 ? `${rawT}:00` : "12:00:00";
  const d = dayjs(`${s.date}T${t}`);
  if (!d.isValid()) return "—";
  if (isAr) {
    return d.format("D MMM YYYY - h:mmA");
  }
  const month = d.format("MMM");
  const y = d.format("YYYY");
  const time = d.format("h:mmA");
  return `${month} ${englishOrdinalDay(d.date())} ${y} - ${time}`;
}

const DEMO_SESSION_NOTES = [
  "wonderful presentation",
  "Attentive in class.",
  "Good work.",
] as const;

function findProfessorNote(
  studentId: number,
  sessionId: number,
  rows: AttendanceRow[]
): string {
  const row = rows.find(
    (x) => x.student === studentId && x.session === sessionId
  );
  return String(row?.extra_values?.professor_note ?? "").trim();
}

function sessionNoteText(
  rowId: number,
  session: SessionApi,
  sessionIndex: number,
  attendance: AttendanceRow[] | undefined,
  isDemo: boolean
): string {
  const fromApi = findProfessorNote(rowId, session.id, attendance ?? []);
  if (fromApi) return fromApi;
  if (isDemo) {
    return DEMO_SESSION_NOTES[sessionIndex % DEMO_SESSION_NOTES.length] ?? "—";
  }
  return "";
}

type HistoryMatrixRow = {
  id: number;
  name: string;
  email: string;
  present: number;
  absent: number;
  justified: number;
};

export default function SemestrialAttendancePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const locale = isAr ? "ar-DZ" : "en-US";

  const assignmentId = Number(sp.get("a") || "");
  const academicYear = useMemo(() => {
    const n = Number(sp.get("ay") || "");
    if (Number.isFinite(n) && n > 2000) return n;
    return currentAcademicStartYear();
  }, [sp]);
  const sem = (sp.get("sem") === "S2" ? "S2" : "S1") as "S1" | "S2";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [studentModal, setStudentModal] = useState<HistoryMatrixRow | null>(
    null
  );
  const [openNoteSessionId, setOpenNoteSessionId] = useState<number | null>(
    null
  );
  const [bundle, setBundle] = useState<
    Awaited<ReturnType<typeof loadProfessorSessionData>> | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const b = await loadProfessorSessionData(isAr);
      setBundle(b);
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : isAr
            ? "تعذر التحميل."
            : "Failed to load."
      );
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    void load();
  }, [load]);

  const { from, to } = useMemo(() => {
    if (!academicYear || Number.isNaN(academicYear)) {
      return { from: "", to: "" };
    }
    return semesterBounds(sem, academicYear);
  }, [sem, academicYear]);

  const canUseLocalDemo = useMemo(
    () =>
      isDemoTeacherAssignmentsEnabled() ||
      (typeof process !== "undefined" &&
        process.env.NODE_ENV === "development"),
    []
  );

  const matrix = useMemo(() => {
    if (!bundle || !assignmentId || !from) return null;
    const real = buildSessionHistoryMatrix(
      assignmentId,
      from,
      to,
      bundle.sessions,
      bundle.teacherAttendanceRows,
      isAr
    );
    const empty =
      real.courseSessions.length === 0 || real.rows.length === 0;
    if (!empty) return real;
    if (canUseLocalDemo) {
      return buildSemestrialDemoMatrix(assignmentId, from, to, isAr);
    }
    return real;
  }, [bundle, assignmentId, from, to, isAr, canUseLocalDemo]);

  const openAssignment = useMemo((): AssignmentApi | null => {
    if (!bundle) return null;
    const found = bundle.assignments.find((a) => a.id === assignmentId);
    if (found) return found;
    if (isDemoTeacherAssignmentId(assignmentId) && isDemoTeacherAssignmentsEnabled()) {
      return buildDemoTeacherAssignments()[0];
    }
    if (canUseLocalDemo) {
      return {
        id: assignmentId,
        group_name: "G4",
        year_name: "1CS",
        semester: "S2",
        module_name: "Gestion des Projets",
      };
    }
    return null;
  }, [bundle, assignmentId, canUseLocalDemo]);

  const dist = useMemo(() => {
    if (!matrix) return { present: 0, absent: 0, justified: 0 };
    if (isDemoSemestrialMatrix(matrix)) {
      return distributionFromMatrixRows(matrix.rows);
    }
    return overallStatusDistributionPct(
      matrix.courseSessions,
      bundle?.teacherAttendanceRows ?? []
    );
  }, [matrix, bundle?.teacherAttendanceRows]);

  useEffect(() => {
    setOpenNoteSessionId(null);
  }, [studentModal?.id]);

  const studentAbsencePcts = useMemo(() => {
    if (!studentModal) return { absent: 0, justified: 0 };
    const t =
      studentModal.absent + studentModal.justified + studentModal.present;
    if (t === 0) return { absent: 0, justified: 0 };
    return {
      absent: Math.round((100 * studentModal.absent) / t),
      justified: Math.round((100 * studentModal.justified) / t),
    };
  }, [studentModal]);

  const sessionNotePills = useMemo(() => {
    if (!studentModal || !matrix) return [];
    const isDemo = isDemoSemestrialMatrix(matrix);
    return matrix.courseSessions.map((session, idx) => ({
      session,
      key: session.id,
      label: formatSessionPillLabel(session, locale, isAr),
      note: sessionNoteText(
        studentModal.id,
        session,
        idx,
        bundle?.teacherAttendanceRows,
        isDemo
      ),
    }));
  }, [studentModal, matrix, bundle?.teacherAttendanceRows, locale, isAr]);

  const filtered = useMemo(() => {
    if (!matrix) return [];
    const q = search.trim().toLowerCase();
    if (!q) return matrix.rows;
    return matrix.rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        userIdFromEmail(r.email).toLowerCase().includes(q)
    );
  }, [matrix, search]);

  const visible = useMemo(
    () => (showAll ? filtered : filtered.slice(0, SHEET_PAGE)),
    [filtered, showAll]
  );

  const yearLabel = (y: number) => `${y}–${(y + 1).toString().slice(-2)}`;

  const exportCsv = () => {
    if (!matrix) return;
    const headers = [
      isAr ? "معرف" : "User ID",
      isAr ? "الاسم" : "Name",
      isAr ? "بريد" : "Email",
      ...matrix.courseSessions.map(
        (s) => shortDateHeader(s, locale) + " " + (s.start_time?.slice(0, 5) ?? "")
      ),
      isAr ? "غياب" : "Absence count",
      isAr ? "نقاط" : "Points",
    ];
    const lines = [headers.join(",")];
    for (const r of filtered) {
      const row = [
        userIdFromEmail(r.email),
        `"${(r.name ?? "").replace(/"/g, '""')}"`,
        `"${(r.email ?? "").replace(/"/g, '""')}"`,
        ...r.cells.map((c) => (c == null ? "—" : c)),
        String(r.absent),
        String(r.present),
      ];
      lines.push(row.join(","));
    }
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `semestrial-${assignmentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!Number.isFinite(assignmentId) || assignmentId < 1) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6 text-center text-sm text-muted-foreground">
        {isAr ? "رابط غير صالح." : "Invalid link."}{" "}
        <Link href="/Sessions" className="text-primary underline">
          {isAr ? "العودة" : "Back"}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {isAr ? "جارٍ التحميل…" : "Loading…"}
        </p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-3 p-6 text-center">
        <p className="text-sm text-destructive">{err}</p>
        <Button type="button" variant="outline" onClick={() => void load()}>
          {isAr ? "إعادة المحاولة" : "Retry"}
        </Button>
      </div>
    );
  }

  if (!openAssignment) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6 text-center text-sm text-muted-foreground">
        {isAr
          ? "تعيين غير معروف. أوّل سطر من الخادم غير مرتبط بهذا المعرّف."
          : "Unknown teaching assignment. The server has no match for this id."}{" "}
        <Link href="/Sessions" className="text-primary underline">
          {isAr ? "العودة" : "Back"}
        </Link>
      </div>
    );
  }

  const sub = [
    openAssignment.group_name?.trim() || "—",
    openAssignment.year_name?.trim() || "—",
    openAssignment.semester?.trim() || sem,
    openAssignment.module_name?.trim() || "—",
  ].join(" - ");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-0 pb-10 pt-2 font-montserrat sm:px-1">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => router.push("/Sessions")}
              aria-label={isAr ? "رجوع" : "Back"}
            >
              <ArrowLeft className="size-5 rtl:rotate-180" />
            </Button>
            <h2 className="text-lg font-bold tracking-tight text-[#1B2065] sm:text-xl">
              {isAr ? "ورقة التحصي النصفي" : "Semestrial Attendance Sheet"}
            </h2>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1B2065] sm:text-3xl">
            {isAr ? "سجل الحصص" : "Your Session History"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "أنشئ الحصص وأدر الحضور."
              : "Create sessions and manage attendance."}
          </p>
          <p className="text-sm font-medium text-[#51689A]">
            {sub}
            <span className="ms-1 block text-xs text-[#7A87A5] sm:inline" dir="ltr">
              {yearLabel(academicYear)} · {from} – {to}
            </span>
          </p>
          {matrix && isDemoSemestrialMatrix(matrix) ? (
            <p className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5 text-xs text-sky-950">
              {isAr
                ? "بيانات تجريبية للواجهة: طلاب وغياب ومبرر وهميّان."
                : "Demo data: sample students with mixed present, absent, and justified (frontend only)."}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0 self-start rounded-lg border-2 border-primary/40 bg-card px-4 text-primary shadow-md hover:bg-primary/5"
          onClick={exportCsv}
        >
          <ArrowUpFromLine className="size-4" />
          {isAr ? "تصدير" : "Export"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-[#74A7BD]/30 bg-gradient-to-br from-[#74A7BD]/12 via-[#FEF9F9] to-[#FEF9F9] px-4 py-4 text-center shadow-sm">
          <div className="pointer-events-none absolute -end-10 -top-8 h-28 w-28 rounded-full bg-fuchsia-200/25 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-6 end-4 h-20 w-20 rounded-full bg-[#74A7BD]/20 blur-2xl" />
          <div className="relative">
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: STATUS_HEX.present }}
            >
              {dist.present}%
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: STATUS_HEX.present }}
            >
              {isAr ? "حاضر" : "Present"}
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#C71122]/45 bg-gradient-to-br from-[#C71122]/10 via-[#FEF9F9] to-[#FEF9F9] px-4 py-4 text-center shadow-sm">
          <div className="pointer-events-none absolute -end-12 top-0 h-32 w-32 rounded-full bg-rose-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 start-0 h-24 w-24 rounded-full bg-[#C71122]/10 blur-2xl" />
          <div className="relative">
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: STATUS_HEX.absent }}
            >
              {dist.absent}%
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: STATUS_HEX.absent }}
            >
              {isAr ? "غائب" : "Absent"}
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-[#E7CE51]/40 bg-gradient-to-br from-[#E7CE51]/10 via-[#FEF9F9] to-[#FEF9F9] px-4 py-4 text-center shadow-sm">
          <div className="pointer-events-none absolute -end-8 -top-6 h-24 w-24 rounded-full bg-amber-200/35 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 end-0 h-20 w-20 rounded-full bg-[#E7CE51]/15 blur-2xl" />
          <div className="relative">
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: STATUS_HEX.justified }}
            >
              {dist.justified}%
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: STATUS_HEX.justified }}
            >
              {isAr ? "غياب مبرر" : "Justified"}
            </p>
          </div>
        </div>
      </div>

      {!matrix || matrix.courseSessions.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          {isAr
            ? "لا توجد حصص في هذه الفترة."
            : "No sessions in this period."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#D8DDF5] bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border bg-[#F6F7FE] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1B2065] ">
              <Users className="size-4 text-primary border border-blue-primary rounded-sm" />
              {isAr ? "قائمة الطلاب" : "Student list"}
            </div>
            <div className="relative w-full min-w-0 sm:max-w-xs">
              <Search className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "بحث…" : "Search…"}
                className="h-9 border-[#51689A]/30 bg-[#FEF9F9] ps-9"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[64rem] border-collapse text-sm"
              dir="ltr"
            >
              <thead>
                <tr className=" bg-[#51689A] text-white">
                  <th className="sticky start-0 z-20 min-w-[5.5rem]  bg-[#51689A] px-2 py-2.5 text-left text-xs font-bold">
                    {isAr ? "المعرّف" : "User ID"}
                  </th>
                  <th className="sticky start-[5.5rem] z-20 min-w-[11rem] bg-[#51689A] px-2 py-2.5 text-left text-xs font-bold">
                    {isAr ? "الاسم" : "Name"}
                  </th>
                  {matrix.courseSessions.map((s) => (
                    <th
                      key={s.id}
                      className="min-w-[4rem] border-e border-white/15 px-1 py-2 text-center text-[10px] font-semibold sm:text-xs"
                    >
                      {shortDateHeader(s, locale)}
                    </th>
                  ))}
                  <th className="min-w-[4rem] bg-[#51689A] px-1 py-2 text-center text-xs font-bold">
                    {isAr ? "غياب" : "Absence count"}
                  </th>
                  <th className="min-w-[3.5rem] bg-[#51689A] px-1 py-2 text-center text-xs font-bold">
                    {isAr ? "نقاط" : "Points"}
                  </th>
                  <th className="min-w-[3rem] bg-[#51689A] px-1 py-2 text-center text-xs font-bold">
                    {isAr ? "ملاحظات" : "Notes"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    className="cursor-pointer border-b border-[#EEF0F7] transition-colors odd:bg-white even:bg-[#FAFBFF] hover:bg-[#EEF1FC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#74A7BD]"
                    onClick={() => setStudentModal(r)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setStudentModal(r);
                      }
                    }}
                    aria-label={
                      isAr
                        ? `تفاصيل ${r.name}`
                        : `Details for ${r.name || "student"}`
                    }
                  >
                    <td className="sticky start-0 z-10 min-w-[5.5rem] border-e border-[#D8DDF5] bg-inherit px-2 py-2 font-mono text-xs text-[#1B2065]">
                      {userIdFromEmail(r.email)}
                    </td>
                    <td className="sticky start-[5.5rem] z-10 min-w-[11rem] border-e border-[#D8DDF5] bg-inherit px-2 py-2">
                      <p className="font-medium text-[#1B2065]">{r.name}</p>
                    </td>
                    {r.cells.map((c, j) => (
                      <td
                        key={matrix.courseSessions[j]?.id ?? j}
                        className="border-e border-[#EEF0F7] px-0.5 py-2 text-center"
                      >
                        <StatusCell s={c} isAr={isAr} />
                      </td>
                    ))}
                    <td className="border-s border-[#D8DDF5] bg-[#FDECEC]/20 px-1 text-center text-sm font-semibold text-[#C71122]">
                      {r.absent}
                    </td>
                    <td className="bg-[#E8F3F6]/20 px-1 text-center text-sm">
                      <span className="inline-flex items-center justify-center gap-0.5 font-semibold text-[#1B2065]">
                        <Star className="size-3.5 fill-primary/30 text-primary" />
                        {r.present}
                      </span>
                    </td>
                    <td className="px-1 text-center">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 text-[#51689A] hover:text-[#1B2065]"
                        aria-label={
                          isAr
                            ? "فتح تفاصيل الملاحظات"
                            : "Open session notes"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          setStudentModal(r);
                        }}
                      >
                        <FileText className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > SHEET_PAGE && (
            <div className="flex justify-end border-t border-border p-3">
              <Button
                type="button"
                className="rounded-lg bg-primary text-primary-foreground"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll
                  ? isAr
                    ? "عرض أقل"
                    : "Show less"
                  : isAr
                    ? "عرض المزيد"
                    : "Show more users"}
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={studentModal != null}
        onOpenChange={(open) => {
          if (!open) {
            setStudentModal(null);
            setOpenNoteSessionId(null);
          }
        }}
      >
        <DialogContent
          showCloseButton
          overlayClassName="fixed inset-0 z-50 bg-[#74A7BDCC] duration-100 supports-backdrop-filter:backdrop-blur-xl data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          className="w-full sm:w-2/3 xl:w-full  gap-0 border-0 bg-white p-6 shadow-lg sm:max-w-3xl sm:rounded-xl font-montserrat sm:p-8"
        >
          {studentModal ? (
            <>
              <div className="flex flex-col gap-1 pe-8 sm:pe-10">
                <DialogTitle asChild>
                  <h2 className="text-start text-xl font-bold leading-tight text-[#1B2065] sm:text-2xl">
                    {studentModal.name || "—"}
                  </h2>
                </DialogTitle>
                <DialogDescription asChild>
                  <p className="text-start text-sm leading-relaxed text-[#51689A] sm:text-[15px]">
                    {isAr
                      ? "اكتب الملاحظات وسجّل نقاط المشاركة."
                      : "Write notes and mark participation points."}
                  </p>
                </DialogDescription>
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-start text-base font-semibold text-[#1B2065]">
                  {isAr ? "معدّل الغياب" : "Absence rate"}
                </p>
                <div className="flex flex-wrap gap-10 sm:gap-14 items-center justify-center">
                  <div className="flex items-baseline gap-11">
                    <span
                      className="text-2xl font-bold tabular-nums"
                      style={{ color: STATUS_HEX.absent }}
                    >
                      {studentAbsencePcts.absent}%
                    </span>
                    <span className="text-sm text-[#7A87A5]">
                      {isAr ? "غائب" : "Absent"}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-11">
                    <span
                      className="text-2xl font-bold tabular-nums"
                      style={{ color: STATUS_HEX.justified }}
                    >
                      {studentAbsencePcts.justified}%
                    </span>
                    <span className="text-sm text-[#7A87A5]">
                      {isAr ? "مبرر" : "Justified"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <p className="text-start text-base font-semibold text-[#1B2065]">
                  {isAr ? "ملاحظات" : "Notes"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sessionNotePills.map((pill) => {
                    const active = openNoteSessionId === pill.session.id;
                    return (
                      <button
                        key={pill.key}
                        type="button"
                        onClick={() =>
                          setOpenNoteSessionId((cur) =>
                            cur === pill.session.id ? null : pill.session.id
                          )
                        }
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          active
                            ? "border-[#51689AF2] bg-[#51689AF2] text-white"
                            : "border-[#1B2065]/35 bg-white text-[#1B2065] hover:bg-[#F6F7FE]"
                        )}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>

                {openNoteSessionId != null
                  ? (() => {
                      const pill = sessionNotePills.find(
                        (p) => p.session.id === openNoteSessionId
                      );
                      if (!pill) return null;
                      return (
                        <div className="relative mt-4 rounded-2xl border border-[#C5D4E0]/80 bg-[#E8F2F6] p-4 pe-10 text-start">
                          <button
                            type="button"
                            className="absolute end-2 top-2 rounded-full p-1.5 text-[#51689A] hover:bg-white/60"
                            aria-label={isAr ? "إغلاق الملاحظة" : "Close note"}
                            onClick={() => setOpenNoteSessionId(null)}
                          >
                            <X className="size-4" />
                          </button>
                          <p
                            className={cn(
                              "text-pretty text-sm sm:text-base",
                              pill.note
                                ? "text-[#51689A]"
                                : "italic text-muted-foreground"
                            )}
                          >
                            {pill.note ||
                              (isAr
                                ? "لا توجد ملاحظة لهذه الحصة."
                                : "No note for this session.")}
                          </p>
                        </div>
                      );
                    })()
                  : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
