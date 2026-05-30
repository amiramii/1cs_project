"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpFromLine,
  CalendarCheck,
  ChevronDown,
  CirclePlay,
  Info,
  Pencil,
  Play,
  Save,
  Search,
  Star,
  Users,
} from "lucide-react";
import { apiUnreachableMessage, isNetworkFailure } from "@/lib/fetchErrors";
import { toast } from "sonner";
import { useLanguage } from "@/app/_components/language-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, notifyUser } from "@/lib/utils";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import ScheduleSessionForm, {
  buildSessionCreateBody,
} from "@/app/_components/sessions/ScheduleSessionForm";
import {
  loadProfessorSessionData,
  type AssignmentApi,
  type AttendanceRow,
  type AttendanceStatus,
  type SessionApi,
} from "@/lib/professorSessionData";
import { getApiBaseUrl } from "@/lib/apiBase";
import {
  createAttendanceSession,
  getAttendanceSessionById,
  patchAttendanceRow,
} from "@/lib/checkinClient";
import { hydrateAttendanceRowsStudentInfo } from "@/lib/attendanceStudentHydrate";
import { checkinPath } from "@/lib/checkinApi";
import { loadDrfListAll } from "@/lib/drfPaginatedList";
import {
  markProfessorSessionClosedLocally,
  readClosedProfessorSessionIds,
} from "@/lib/professorClosedSessions";
import { getAccessToken, getStoredUserEmail } from "@/lib/tokenStorage";

type RowDraft = {
  status: AttendanceStatus;
  participation_points: number;
  professor_note: string;
};

type ProfessorOption = {
  id: number;
  full_name?: string;
  email?: string;
};

function listHeaders(): HeadersInit {
  const token = getAccessToken();
  return token?.trim() ? { Authorization: `Bearer ${token.trim()}` } : {};
}

function readExtraFromRow(row: AttendanceRow): {
  participation_points: number;
  professor_note: string;
} {
  const ex = row.extra_values ?? {};
  const pts = Number(ex.participation_points);
  return {
    participation_points: Number.isFinite(pts) ? Math.trunc(pts) : 0,
    professor_note: String(ex.professor_note ?? ""),
  };
}

function serverRowDraft(row: AttendanceRow): RowDraft {
  const { participation_points, professor_note } = readExtraFromRow(row);
  return {
    status: row.status,
    participation_points,
    professor_note,
  };
}

function draftEquals(a: RowDraft, b: RowDraft) {
  return (
    a.status === b.status &&
    a.participation_points === b.participation_points &&
    a.professor_note === b.professor_note
  );
}

/** Rows shown per page before “show more” on the attendance sheet (large groups). */
const SHEET_PAGE_SIZE = 12;

/** Chekin status colors (Present / Absent / Justified) */
const STATUS_HEX = {
  present: "#74A7BD",
  absent: "#C71122",
  justified: "#E7CE51",
} as const;

function todayLocalIso(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Django session payloads omit module/group strings; fill from the teaching-assignment catalog. */
function applyAssignmentCatalogLabels(
  session: SessionApi,
  catalogs: AssignmentApi[]
): SessionApi {
  const cat = catalogs.find((a) => a.id === session.assignment);
  if (!cat) return session;
  return {
    ...session,
    module_name: session.module_name ?? cat.module_name,
    group_name: session.group_name ?? cat.group_name,
    year_name: session.year_name ?? cat.year_name,
    semester: session.semester ?? cat.semester,
  };
}

/** Django session payloads omit module/group strings; reuse teaching-assignment catalog + cached rows. */
function enrichSessionSheetPayload(
  session: SessionApi,
  catalogs: AssignmentApi[],
  teacherFlat: AttendanceRow[]
): SessionApi {
  const next = applyAssignmentCatalogLabels(session, catalogs);
  const sid = session.id;
  const flatById = new Map(
    teacherFlat.filter((r) => r.session === sid).map((r) => [r.id, r] as const)
  );
  const attendances = (next.attendances ?? []).map((row) => {
    const f = flatById.get(row.id);
    return {
      ...row,
      session: sid,
      student_name: row.student_name ?? f?.student_name,
      student_email: row.student_email ?? f?.student_email,
    };
  });
  return { ...next, attendances };
}

function formatSessionSubtitle(
  s: SessionApi,
  locale: string,
  fallback: string
): string {
  const mod = s.module_name ?? "?";
  const grp = s.group_name ?? "?";
  let dateLabel = fallback;
  try {
    const dt = new Date(s.date + "T12:00:00");
    dateLabel = dt.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    /* ignore */
  }
  const room = s.room?.trim();
  return [mod, grp, dateLabel, room].filter(Boolean).join(" — ");
}

/**
 * Clicks on shadcn `Select` content are portaled under `document.body`. The Radix
 * dialog would otherwise treat them as "outside" and block or close.
 */
function isScheduleFormPortaledLayerTarget(
  target: EventTarget | null
): boolean {
  const el =
    target && "nodeType" in target && (target as Node).nodeType === Node.TEXT_NODE
      ? (target as Text).parentElement
      : target instanceof Element
        ? target
        : null;
  if (!el) return false;
  return Boolean(
    el.closest(
      '[data-slot="select-content"],[data-radix-select-content],[data-radix-popper-content-wrapper]'
    )
  );
}

/**
 * Professor-facing session list + attendance workflow.
 * - Loads teaching assignments, sessions, and flattened attendance rows.
 * - `notifyUser` fires on meaningful events (session opened, saved, created) so
 *   teachers get OS-level feedback when the dashboard tab is in the background.
 */
export default function ProfessorSessionsView() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  /** Avoid refetch races when language flips on hydrate (keeps initial load single-flight). */
  const isArRef = useRef(isAr);
  isArRef.current = isAr;
  const locale = isAr ? "ar-DZ" : "en-US";
  const apiBase = getApiBaseUrl();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** True when assignments came from session rows (assignments API unavailable). */
  const [sessionsFetchDegraded, setSessionsFetchDegraded] = useState(false);
  const [assignmentsCatalogFallback, setAssignmentsCatalogFallback] =
    useState(false);
  const [assignments, setAssignments] = useState<AssignmentApi[]>([]);
  const [sessions, setSessions] = useState<SessionApi[]>([]);
  /** All attendance rows for the teacher — used for absence counts across sessions */
  const [teacherAttendanceRows, setTeacherAttendanceRows] = useState<
    AttendanceRow[]
  >([]);

  const [workingSession, setWorkingSession] = useState<SessionApi | null>(null);
  /** Local edits (from the row modal) until the professor ends the session with Save. */
  const [rowOverrides, setRowOverrides] = useState<Record<number, RowDraft>>({});
  const [rowModal, setRowModal] = useState<AttendanceRow | null>(null);
  const [modalDraft, setModalDraft] = useState<RowDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [sheetShowAll, setSheetShowAll] = useState(false);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newAssignmentId, setNewAssignmentId] = useState<number | "">("");
  const [classRoom, setClassRoom] = useState("");
  const [professors, setProfessors] = useState<ProfessorOption[]>([]);
  const [requestedProfessorId, setRequestedProfessorId] = useState("");
  const [sessionStart, setSessionStart] = useState<Dayjs>(() =>
    dayjs(`${todayLocalIso()}T08:00:00`).add(1, "day")
  );
  const [sessionEnd, setSessionEnd] = useState<Dayjs>(() =>
    dayjs(`${todayLocalIso()}T08:00:00`).add(1, "day").add(2, "hour")
  );
  const [creating, setCreating] = useState(false);
  /** Re-read browser closed-session ids after Save (backend has no completed flag). */
  const [closedSessionsBump, setClosedSessionsBump] = useState(0);

  const getRowDraft = useCallback(
    (row: AttendanceRow): RowDraft =>
      rowOverrides[row.id] ?? serverRowDraft(row),
    [rowOverrides]
  );

  const refreshData = useCallback(async () => {
    const ar = isArRef.current;
    try {
      const bundle = await loadProfessorSessionData(ar);
      setSessions(bundle.sessions);
      setTeacherAttendanceRows(bundle.teacherAttendanceRows);
      setAssignments(bundle.assignments);
      setAssignmentsCatalogFallback(bundle.assignmentsCatalogFallback);
      setSessionsFetchDegraded(bundle.sessionsFetchDegraded ?? false);
    } catch (e) {
      setAssignments([]);
      setSessions([]);
      setTeacherAttendanceRows([]);
      setAssignmentsCatalogFallback(false);
      setSessionsFetchDegraded(false);
      if (isNetworkFailure(e)) {
        throw new Error(apiUnreachableMessage(apiBase, ar));
      }
      throw e;
    }
  }, [apiBase]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        await refreshData();
      } catch (e) {
        if (!isNetworkFailure(e)) {
          console.warn("ProfessorSessionsView load:", e);
        }
        if (alive) {
          setLoadError(
            e instanceof Error
              ? e.message
              : isArRef.current
                ? "خطأ في التحميل."
                : "Failed to load."
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [refreshData]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await loadDrfListAll<ProfessorOption>(
          getApiBaseUrl(),
          `${checkinPath.teachers}/`,
          listHeaders(),
          {}
        );
        const currentEmail = getStoredUserEmail()?.trim().toLowerCase();
        const otherProfessors = currentEmail
          ? rows.filter(
              (professor) =>
                professor.email?.trim().toLowerCase() !== currentEmail
            )
          : rows;
        if (alive) setProfessors(otherProfessors);
      } catch {
        if (alive) setProfessors([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const todayStr = todayLocalIso();

  const locallyClosedSessionIds = useMemo(() => {
    void closedSessionsBump;
    return readClosedProfessorSessionIds();
  }, [closedSessionsBump]);

  const sessionsWithCatalogLabels = useMemo(
    () =>
      sessions.map((s) => applyAssignmentCatalogLabels(s, assignments)),
    [sessions, assignments]
  );

  const todaySessions = useMemo(() => {
    return sessionsWithCatalogLabels
      .filter(
        (s) =>
          s.date === todayStr && !locallyClosedSessionIds.has(s.id)
      )
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
  }, [sessionsWithCatalogLabels, todayStr, locallyClosedSessionIds]);

  const highlightSession = todaySessions[0] ?? null;

  const startWorking = async (
    s: SessionApi,
    opts?: { resetFeedback?: boolean }
  ) => {
    const resetFeedback = opts?.resetFeedback !== false;
    let full: SessionApi = s;
    try {
      const res = await getAttendanceSessionById(s.id);
      if (res.ok) {
        full = (await res.json()) as SessionApi;
      }
    } catch {
      /* use list payload */
    }
    full = enrichSessionSheetPayload(full, assignments, teacherAttendanceRows);
    try {
      const hydrated = await hydrateAttendanceRowsStudentInfo(
        full.attendances ?? []
      );
      full = { ...full, attendances: hydrated };
    } catch {
      /* keep enrichment from catalog / flat bundle only */
    }
    setWorkingSession(full);
    setRowOverrides({});
    if (resetFeedback) setSaveMsg(null);
    setTableSearch("");
    setSheetShowAll(false);
    if (resetFeedback) {
      void notifyUser({
        title: isAr ? "حصة" : "Session",
        body: formatSessionSubtitle(full, locale, isAr ? "التاريخ" : "Date"),
        tag: `session-open-${full.id}`,
      });
    }
  };

  const stats = useMemo(() => {
    const rows = workingSession?.attendances ?? [];
    if (rows.length === 0) {
      return { present: 0, absent: 0, justified: 0 };
    }
    let p = 0,
      a = 0,
      j = 0;
    rows.forEach((r) => {
      const st = getRowDraft(r).status;
      if (st === "present") p++;
      else if (st === "justified") j++;
      else a++;
    });
    const n = rows.length;
    return {
      present: Math.round((p / n) * 100),
      absent: Math.round((a / n) * 100),
      justified: Math.round((j / n) * 100),
    };
  }, [workingSession, getRowDraft]);

  const filteredRows = useMemo(() => {
    const rows = workingSession?.attendances ?? [];
    const q = tableSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = (r.student_name ?? "").toLowerCase();
      const mail = (r.student_email ?? "").toLowerCase();
      const idStr = String(r.student);
      return name.includes(q) || mail.includes(q) || idStr.includes(q);
    });
  }, [workingSession, tableSearch]);

  const requestedProfessorLabel = useMemo(() => {
    const selected = professors.find(
      (professor) => String(professor.id) === requestedProfessorId
    );
    if (!selected) return isAr ? "اختر أستاذًا" : "Select professor";
    return (
      selected.full_name?.trim() ||
      selected.email?.trim() ||
      `Professor #${selected.id}`
    );
  }, [professors, requestedProfessorId, isAr]);

  const sheetRowsVisible = useMemo(() => {
    if (sheetShowAll) return filteredRows;
    return filteredRows.slice(0, SHEET_PAGE_SIZE);
  }, [filteredRows, sheetShowAll]);

  const saveAttendance = async () => {
    if (!workingSession) return;
    const rows = workingSession.attendances ?? [];
    setSaving(true);
    setSaveMsg(null);
    try {
      for (const row of rows) {
        const eff = getRowDraft(row);
        const srv = serverRowDraft(row);
        if (draftEquals(eff, srv)) continue;
        const baseEx =
          row.extra_values && typeof row.extra_values === "object"
            ? { ...row.extra_values }
            : {};
        const mergedExtra: Record<string, unknown> = {
          ...baseEx,
          participation_points: eff.participation_points,
          professor_note: eff.professor_note,
        };
        if (srv.status === "justified") {
          const res = await patchAttendanceRow(row.id, {
            extra_values: mergedExtra,
          });
          if (!res.ok) throw new Error(await res.text());
          continue;
        }
        const res = await patchAttendanceRow(row.id, {
          status: eff.status,
          extra_values: mergedExtra,
        });
        if (!res.ok) throw new Error(await res.text());
      }
      await refreshData();
      markProfessorSessionClosedLocally(workingSession.id);
      setClosedSessionsBump((n) => n + 1);
      setSaveMsg(
        isAr
          ? "تم حفظ الورقة وإنهاء الحصة."
          : "Session saved and completed."
      );
      void notifyUser({
        title: isAr ? "انتهت الحصة" : "Session complete",
        body: isAr
          ? "سُجّل الحضور والنقاط والملاحظات في السجل."
          : "Attendance, points, and notes were stored in history.",
        tag: `session-close-${workingSession.id}`,
      });
      setWorkingSession(null);
      setRowOverrides({});
      setRowModal(null);
      setModalDraft(null);
    } catch (e) {
      console.error(e);
      setSaveMsg(isAr ? "فشل الحفظ." : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    if (!workingSession) return;
    const rows = workingSession.attendances ?? [];
    const header = [
      "user_id",
      "name",
      "email",
      "presence",
      "participation_points",
      "professor_note",
    ];
    const lines = [
      header.join(","),
      ...rows.map((r) => {
        const d = getRowDraft(r);
        return [
          r.student_email?.split("@")[0] ?? r.student,
          `"${(r.student_name ?? "").replace(/"/g, '""')}"`,
          `"${(r.student_email ?? "").replace(/"/g, '""')}"`,
          d.status,
          d.participation_points,
          `"${(d.professor_note ?? "").replace(/"/g, '""')}"`,
        ].join(",");
      }),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absence-sheet-${workingSession.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createSession = async () => {
    if (newAssignmentId === "") return;
    if (!sessionStart.isAfter(dayjs(), "day")) {
      toast.error(
        isAr
          ? "لا يمكن إنشاء حصة بتاريخ اليوم أو تاريخ سابق."
          : "You can only schedule sessions for a future date."
      );
      return;
    }

    setCreating(true);
    try {
      const payload = buildSessionCreateBody(
        newAssignmentId,
        sessionStart,
        sessionEnd,
        classRoom
      );
      const res = await createAttendanceSession(
        payload as Record<string, unknown>
      );
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || "create failed");
      }
      await refreshData();
      setShowScheduleForm(false);
      toast.success(
        isAr
          ? "تم إنشاء الحصة. تم إشعار الطلاب."
          : "Session created. Students have been notified."
      );
      let created: SessionApi | null = null;
      try {
        created = text ? (JSON.parse(text) as SessionApi) : null;
      } catch {
        created = null;
      }
      if (created?.id) {
        await startWorking(created);
      }
    } catch (e) {
      console.error(e);
      toast.error(isAr ? "تعذر إنشاء الحصة." : "Could not create session.");
    } finally {
      setCreating(false);
    }
  };

  const sheetTitle =
    workingSession &&
    formatSessionSubtitle(
      workingSession,
      locale,
      isAr ? "التاريخ" : "Date"
    );

  if (loading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-border bg-card/80">
        <p className="text-sm text-muted-foreground">
          {isAr ? "جارٍ تحميل الحصص وإدارة الغياب…" : "Loading sessions…"}
        </p>
      </div>
    );
  }

  if (loadError && !workingSession) {
    return (
      <p className="text-sm text-destructive">
        {loadError}{" "}
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-destructive underline"
          onClick={() => {
            setLoadError(null);
            setLoading(true);
            refreshData().finally(() => setLoading(false));
          }}
        >
          {isAr ? "إعادة المحاولة" : "Retry"}
        </Button>
      </p>
    );
  }

  if (workingSession && sheetTitle) {
    const exitSheet = () => {
      setWorkingSession(null);
      setRowOverrides({});
      setRowModal(null);
      setModalDraft(null);
      setSaveMsg(null);
    };

    const openStudentModal = (row: AttendanceRow) => {
      setRowModal(row);
      setModalDraft({ ...getRowDraft(row) });
    };

    const commitModal = () => {
      if (!rowModal || !modalDraft) return;
      setRowOverrides((prev) => ({
        ...prev,
        [rowModal.id]: { ...modalDraft },
      }));
      setRowModal(null);
      setModalDraft(null);
    };

    const cancelModal = () => {
      setRowModal(null);
      setModalDraft(null);
    };

    return (
      <div className="w-full min-w-0 space-y-5">
        <div className="space-y-4 border-b border-border pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="flex min-w-0 items-start gap-2 sm:gap-3 sm:min-w-0 sm:flex-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-0.5 shrink-0 text-foreground hover:bg-primary/10"
                onClick={exitSheet}
                aria-label={isAr ? "رجوع" : "Back"}
              >
                <ArrowLeft className="size-5 rtl:rotate-180" />
              </Button>
              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="break-words text-xl font-bold tracking-tight text-foreground">
                  {isAr ? "ورقة الحضور اليومية" : "Daily Attendance Sheet"}
                </h2>
                <p className="break-words text-sm text-muted-foreground">
                  {sheetTitle}
                </p>
                <p className="break-words text-xs text-muted-foreground">
                  {isAr
                    ? "انقر صفًا لتحرير الحضور والنقاط والملاحظات. «حفظ» يُسجّل كل شيء ويُنهي الحصة."
                    : "Click a row to edit presence, points, and notes. Save stores everything and ends the session."}
                </p>
              </div>
            </div>
            <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:justify-end sm:gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 min-w-0 rounded-lg border-2 border-primary bg-card px-3 text-sm text-primary shadow-md hover:bg-primary/5 sm:px-4"
                onClick={exportCsv}
              >
                <ArrowUpFromLine className="size-4 shrink-0" />
                {isAr ? "تصدير" : "Export"}
              </Button>
              <Button
                type="button"
                className="h-10 min-w-0 rounded-lg bg-[#51689A] px-3 text-sm text-white-primary shadow-md hover:bg-[#51689A]/90 sm:px-5"
                onClick={() => void saveAttendance()}
                disabled={saving}
              >
                <Save className="size-4 shrink-0" />
                {saving
                  ? isAr
                    ? "جارٍ الحفظ…"
                    : "Saving…"
                  : isAr
                    ? "حفظ"
                    : "Save"}
              </Button>
            </div>
          </div>
        </div>

        {(workingSession.attendances?.length ?? 0) === 0 ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950 [&_svg]:text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100 dark:[&_svg]:text-amber-200">
            <Info aria-hidden />
            <AlertTitle>{isAr ? "لا توجد صفوف حضور" : "No attendance rows"}</AlertTitle>
            <AlertDescription>
              {isAr
                ? "لم يُرجع الخادم أي سجل حضور لهذه الحصة. هذا يحدث عادةً عندما لا يوجد طلاب مسجَّلون في شعبة التعيين التدريسي، أو عند تقييد وصول حسابكم لـ«طالب» أو «طلاب». بعد إضافة طلاب للشعبة، أنشئ الحصة من جديد أو أعد ضبط السجلات من الخادم."
                : "The server returned no attendance records for this session. That usually means there are zero students enrolled in the teaching assignment’s group, or this login cannot retrieve student profiles (needed to show names). Enroll students in that group—then sessions created for this assignment include one row per student."}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-xl border border-[#74A7BD]/30 bg-gradient-to-br from-[#74A7BD]/12 via-[#FEF9F9] to-[#FEF9F9] px-4 py-4 text-center shadow-sm dark:border-[#74A7BD]/25 dark:from-[#152A38]/60 dark:via-[#13182A] dark:to-[#13182A]">
            <div className="pointer-events-none absolute -end-10 -top-8 h-24 w-24 rounded-full bg-fuchsia-200/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-6 end-4 h-16 w-16 rounded-full bg-[#74A7BD]/20 blur-2xl" />
            <div className="relative">
              <p
                className="text-2xl font-bold"
                style={{ color: STATUS_HEX.present }}
              >
                {stats.present}%
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: STATUS_HEX.present }}
              >
                {isAr ? "حاضر" : "Present"}
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border-2 border-[#C71122]/45 bg-gradient-to-br from-[#C71122]/10 via-[#FEF9F9] to-[#FEF9F9] px-4 py-4 text-center shadow-sm dark:border-[#E85462]/45 dark:from-[#3A1A22]/40 dark:via-[#13182A] dark:to-[#13182A]">
            <div className="pointer-events-none absolute -end-12 top-0 h-28 w-28 rounded-full bg-rose-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-6 start-0 h-20 w-20 rounded-full bg-[#C71122]/10 blur-2xl" />
            <div className="relative">
              <p
                className="text-2xl font-bold"
                style={{ color: STATUS_HEX.absent }}
              >
                {stats.absent}%
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: STATUS_HEX.absent }}
              >
                {isAr ? "غائب" : "Absent"}
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-[#E7CE51]/40 bg-gradient-to-br from-[#E7CE51]/10 via-[#FEF9F9] to-[#FEF9F9] px-4 py-4 text-center shadow-sm dark:border-[#E7CE51]/40 dark:from-[#3A3420]/40 dark:via-[#13182A] dark:to-[#13182A]">
            <div className="pointer-events-none absolute -end-8 -top-6 h-20 w-20 rounded-full bg-amber-200/35 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 end-0 h-16 w-16 rounded-full bg-[#E7CE51]/15 blur-2xl" />
            <div className="relative">
              <p
                className="text-2xl font-bold"
                style={{ color: STATUS_HEX.justified }}
              >
                {stats.justified}%
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: STATUS_HEX.justified }}
              >
                {isAr ? "مبرر" : "Justified"}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between bg-[#F6F7FE] dark:bg-[#242A40]">
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
              <Users
                className="size-4 shrink-0 text-[#1B2065F2] dark:text-[#EEF4F7] border border-[#1B2065F2] rounded-sm"
                aria-hidden
              />
              {isAr ? "قائمة الطلاب" : "Student list"}
            </div>
            <div className="relative w-full min-w-0 sm:max-w-xs sm:shrink-0 ">
              <Search className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground " />
              <Input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder={isAr ? "بحث عن طالب…" : "Search students…"}
                className="h-10 min-w-0 rounded-full border-border bg-[#FEF9F9] dark:bg-[#1A2036] ps-10 pe-4 text-sm text-foreground ring-offset-2 focus-visible:ring-blue-secondary/40"
              />
            </div>
          </div>
          <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-0 text-sm">
              <thead>
                <tr className="bg-blue-primary text-white-primary dark:bg-[#242A40] dark:text-[#EEF4F7]">
                  <th className="px-1.5 py-2 text-start text-[0.7rem] font-semibold sm:px-3 sm:py-3 sm:text-sm">
                    {isAr ? "المعرّف" : "User ID"}
                  </th>
                  <th className="px-1.5 py-2 text-start text-[0.7rem] font-semibold sm:px-3 sm:py-3 sm:text-sm">
                    {isAr ? "الاسم" : "Name"}
                  </th>
                  <th className="px-1.5 py-2 text-center text-[0.7rem] font-semibold sm:px-3 sm:py-3 sm:text-sm">
                    {isAr ? "تعليم الحضور" : "Mark presence"}
                  </th>
                  <th className="px-1.5 py-2 text-center text-[0.7rem] font-semibold sm:px-3 sm:py-3 sm:text-sm">
                    {isAr ? "النقاط" : "Points"}
                  </th>
                  <th className="px-1.5 py-2 text-center text-[0.7rem] font-semibold sm:px-3 sm:py-3 sm:text-sm">
                    {isAr ? "ملاحظات" : "Notes"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sheetRowsVisible.map((row) => {
                  const d = getRowDraft(row);
                  const st = d.status;
                  const letter =
                    st === "present" ? "P" : st === "absent" ? "A" : "J";
                  const markBg =
                    st === "present"
                      ? STATUS_HEX.present
                      : st === "absent"
                        ? STATUS_HEX.absent
                        : STATUS_HEX.justified;
                  const fg =
                    st === "justified" && letter === "J" ? "#1B2065" : "#fff";
                  const hasNote = (d.professor_note ?? "").trim().length > 0;
                  return (
                    <tr
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openStudentModal(row)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openStudentModal(row);
                        }
                      }}
                      className="cursor-pointer border-b border-border odd:bg-card even:bg-muted/30 hover:bg-primary/5 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-secondary/50 dark:even:bg-muted/15"
                    >
                      <td className="px-1.5 py-2.5 font-mono text-xs text-foreground sm:px-3">
                        {row.student_email?.split("@")[0] ?? row.student}
                      </td>
                      <td className="max-w-[12rem] truncate px-1.5 py-2.5 text-foreground min-[400px]:max-w-[200px] sm:px-3">
                        {row.student_name ?? row.student_email ?? "—"}
                      </td>
                      <td className="px-1.5 py-2 text-center sm:px-2">
                        <span
                          className="inline-flex h-8 min-w-8 items-center justify-center rounded-md text-sm font-bold"
                          style={{
                            backgroundColor: markBg,
                            color: fg,
                            border: `1px solid ${markBg}`,
                          }}
                        >
                          {letter}
                        </span>
                      </td>
                      <td className="px-1.5 py-2.5 text-center text-foreground sm:px-3">
                        <span className="inline-flex items-center justify-center gap-1 tabular-nums">
                          <Star
                            className="size-3.5 shrink-0  text-amber-400 sm:size-4"
                            aria-hidden
                          />
                          <span className="font-semibold text-blue-primary">
                            {d.participation_points}
                          </span>
                        </span>
                      </td>
                      <td className="px-1.5 py-2.5 text-center sm:px-3">
                        <Pencil
                          className={cn(
                            "mx-auto size-4",
                            hasNote
                              ? "text-blue-primary"
                              : "text-muted-foreground/70"
                          )}
                          aria-hidden
                        />
                        <span className="sr-only">
                          {hasNote
                            ? isAr
                              ? "يوجد ملاحظات"
                              : "Has notes"
                            : isAr
                              ? "لا ملاحظات"
                              : "No notes"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredRows.length > SHEET_PAGE_SIZE && (
            <div className="flex justify-end border-t border-border p-3">
              <Button
                type="button"
                className="rounded-lg bg-blue-primary text-primary-foreground hover:bg-blue-primary/90"
                onClick={() => setSheetShowAll((v) => !v)}
              >
                {sheetShowAll
                  ? isAr
                    ? "عرض أقل"
                    : "Show less"
                  : isAr
                    ? `عرض المزيد (${filteredRows.length - SHEET_PAGE_SIZE}+)`
                    : `Show more users (${filteredRows.length - SHEET_PAGE_SIZE}+)`}
              </Button>
            </div>
          )}
        </div>

        <Dialog
          open={rowModal != null}
          onOpenChange={(open) => {
            if (!open) cancelModal();
          }}
        >
          <DialogContent
            showCloseButton={false}
            overlayClassName="fixed inset-0 z-50 bg-[#74A7BDCC] duration-100 supports-backdrop-filter:backdrop-blur-xl data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
            className="max-h-[min(90dvh,calc(100dvh-0.5rem))] w-full min-w-0 overflow-x-hidden overflow-y-auto border-border bg-[#FEF9F9] p-3 shadow-md dark:border-[#383F58] dark:bg-[#1A2036] sm:max-w-2xl sm:rounded-xl sm:p-6"
          >
            {rowModal && modalDraft ? (
              <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-5">
                <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <DialogTitle asChild>
                    <h2 className="w-full min-w-0 text-balance break-words text-start text-lg font-bold leading-tight text-[#1B2065] dark:text-[#EEF4F7] sm:flex-1 sm:text-xl">
                    {rowModal.student_name ??
                      rowModal.student_email ??
                      "—"}
                    </h2>
                  </DialogTitle>
                  <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:justify-end">
                    <Button
                      type="button"
                      className="h-10 min-w-0 rounded-md bg-[#1B2065] text-sm text-white shadow-md hover:bg-[#1B2065]/90"
                      onClick={cancelModal}
                    >
                      {isAr ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button
                      type="button"
                      className="h-10 min-w-0 rounded-md border-0 bg-[#74A7BD] text-sm text-white shadow-md hover:bg-[#74A7BD]/90"
                      onClick={commitModal}
                    >
                      {isAr ? "حفظ" : "Save"}
                    </Button>
                  </div>
                </div>

                <DialogDescription asChild>
                  <p className="min-w-0 break-words text-pretty text-start text-sm leading-relaxed text-[#51689A] dark:text-[#9BA8C4] sm:text-[15px]">
                    {isAr
                      ? "تأكد من الحضور، وأضف النقاط والملاحظات."
                      : "Check attendance, write notes, and set participation points."}
                  </p>
                </DialogDescription>

                {modalDraft.status === "justified" ? (
                  <p className="rounded-lg border border-chekin-warning/40 bg-chekin-warning/10 px-3 py-2 text-start text-xs text-foreground dark:border-[#E7CE51]/35 dark:bg-[#3A3420]/50 dark:text-[#EEF4F7] sm:text-sm">
                    {isAr
                      ? "حالة «غياب مبرر» تُحدّث تلقائيًا عند موافقة الإدارة على المستندات. يمكنك تعديل النقاط والملاحظات فقط."
                      : "“Justified” is set automatically when the school approves a student’s absence. You can only edit points and notes."}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
                  <span className="shrink-0 pt-0.5 text-sm font-bold text-[#1B2065] dark:text-[#EEF4F7] sm:min-w-[5.5rem] sm:pt-2.5">
                    {isAr ? "الحضور" : "Attendance"}
                  </span>
                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-4">
                    <button
                      type="button"
                      disabled={modalDraft.status === "justified"}
                      onClick={() =>
                        setModalDraft((d) =>
                          d ? { ...d, status: "present" } : d
                        )
                      }
                      className={cn(
                        "flex w-full min-w-0 items-center justify-start gap-2 border-0 bg-transparent py-1.5 text-start text-sm font-medium text-[#1B2065] dark:text-[#EEF4F7] shadow-none ring-0 transition-opacity outline-none min-[400px]:justify-center min-[400px]:gap-2.5 min-[400px]:text-base",
                        "hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[#74A7BD]/50 focus-visible:ring-offset-2",
                        modalDraft.status === "justified" &&
                          "pointer-events-none cursor-not-allowed opacity-50",
                        modalDraft.status !== "present" && "opacity-70"
                      )}
                      aria-pressed={modalDraft.status === "present"}
                    >
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white",
                          modalDraft.status === "present"
                            ? "bg-[#74A7BD]"
                            : "bg-[#74A7BD]/45"
                        )}
                      >
                        P
                      </span>
                      <span className="min-w-0 break-words">
                        {isAr ? "حاضر" : "Present"}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={modalDraft.status === "justified"}
                      onClick={() =>
                        setModalDraft((d) =>
                          d ? { ...d, status: "absent" } : d
                        )
                      }
                      className={cn(
                        "flex w-full min-w-0 items-center justify-start gap-2 border-0 bg-transparent py-1.5 text-start text-sm font-medium text-[#1B2065] dark:text-[#EEF4F7] shadow-none ring-0 transition-opacity outline-none min-[400px]:justify-center min-[400px]:gap-2.5 min-[400px]:text-base",
                        "hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[#C71122]/50 focus-visible:ring-offset-2",
                        modalDraft.status === "justified" &&
                          "pointer-events-none cursor-not-allowed opacity-50",
                        modalDraft.status !== "absent" && "opacity-70"
                      )}
                      aria-pressed={modalDraft.status === "absent"}
                    >
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white",
                          modalDraft.status === "absent"
                            ? "bg-[#C71122]"
                            : "bg-[#C71122]/40"
                        )}
                      >
                        A
                      </span>
                      <span className="min-w-0 break-words">
                        {isAr ? "غائب" : "Absent"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="shrink-0 sm:min-w-[5.5rem] sm:max-w-[12rem] sm:flex-1">
                    <p className="text-sm font-bold text-[#1B2065] dark:text-[#EEF4F7]">
                      {isAr ? "نقاط المشاركة" : "Participation points"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isAr
                        ? "إضافة خصم أو منح نقاط"
                        : "Add or deduct participation points"}
                    </p>
                  </div>
                  <div className="w-full min-w-0 sm:max-w-[11rem] sm:flex-none sm:ms-auto">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={-100}
                      max={100}
                      value={modalDraft.participation_points}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setModalDraft((d) =>
                          d
                            ? {
                                ...d,
                                participation_points: Number.isFinite(v)
                                  ? Math.trunc(v)
                                  : 0,
                              }
                            : d
                        );
                      }}
                      className="h-10 w-full rounded-md border border-[#1B2065]/20 bg-white dark:bg-[#1A2036] px-3 text-end text-base tabular-nums text-[#1B2065] dark:text-[#EEF4F7] shadow-md outline-none transition-[border,box-shadow] focus:border-[#74A7BD] focus:ring-2 focus:ring-[#74A7BD]/25"
                    />
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <p className="text-sm font-bold text-[#1B2065] dark:text-[#EEF4F7]">
                    {isAr ? "ملاحظات" : "Notes"}
                  </p>
                  <Textarea
                    placeholder={isAr ? "اكتب ملاحظات…" : "write notes…"}
                    className="min-h-[120px] w-full max-w-full resize-y rounded-lg border-border bg-white text-base text-[#1B2065] placeholder:text-[#51689A]/70 dark:border-[#383F58] dark:bg-[#242A40] dark:text-[#EEF4F7] dark:placeholder:text-[#9BA8C4] sm:min-h-[100px]"
                    value={modalDraft.professor_note}
                    onChange={(e) =>
                      setModalDraft((d) =>
                        d ? { ...d, professor_note: e.target.value } : d
                      )
                    }
                  />
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {saveMsg && (
          <Alert
            variant={
              saveMsg.includes("فشل") || /failed/i.test(saveMsg)
                ? "destructive"
                : "default"
            }
            className={
              saveMsg.includes("فشل") || /failed/i.test(saveMsg)
                ? undefined
                : "border-blue-secondary/35 bg-blue-secondary/10"
            }
          >
            <Info aria-hidden />
            <div className="min-w-0 flex-1 space-y-1">
              <AlertTitle>
                {saveMsg.includes("فشل") || /failed/i.test(saveMsg)
                  ? isAr
                    ? "خطأ"
                    : "Error"
                  : isAr
                    ? "تم"
                    : "Done"}
              </AlertTitle>
              <AlertDescription>{saveMsg}</AlertDescription>
            </div>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-border"
            onClick={exitSheet}
          >
            {isAr ? "← الخروج من الحصة" : "← Exit session"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-5 font-montserrat text-[#1B2065] dark:text-[#EEF4F7]">
      <header className="min-w-0 space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {isAr ? "حصصك" : "Your Sessions"}
        </h1>
        <p className="text-[15px] text-[#51689A] dark:text-[#9BA8C4]">
          {isAr
            ? "أنشئ الحصص وأدر الحضور"
            : "Create sessions and manage attendance"}
        </p>
      </header>

      {sessionsFetchDegraded ? (
        <Alert className="border-amber-300 bg-amber-50 text-amber-950 [&_svg]:text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100 dark:[&_svg]:text-amber-200">
          <Info aria-hidden />
          <AlertTitle>
            {isAr ? "تعذر تحميل قائمة الحصص من الخادم" : "Could not load sessions from the server"}
          </AlertTitle>
          <AlertDescription>
            {isAr
              ? "نعرض واجهة فارغة بدل رسالة خطأ. تحقق من الاتصال أو من صلاحيات حساب الأستاذ. يمكنك ما زال محاولة إنشاء حصة جديدة إذا ظهرت تعييناتك أدناه."
              : "Showing an empty list instead of an error page. Check connectivity or your teacher permissions. You can still try creating a session if your assignments appear below."}
          </AlertDescription>
        </Alert>
      ) : null}

      {assignmentsCatalogFallback ? (
        <Alert className="border-chekin-warning/40 bg-chekin-warning/10">
          <Info aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <AlertTitle>
              {isAr ? "قائمة التعيينات" : "Teaching assignments"}
            </AlertTitle>
            <AlertDescription>
              {isAr
                ? "تعذّر تحميل قائمة التعيينات من الخادم. عند إنشاء حصة جديدة، تُستمد خيارات المستوى والمادة من حصصك الحالية عندما تكون متوفرة."
                : "The teaching-assignment list could not be loaded from the server. When you schedule a new session, module and group choices use your existing sessions when available."}
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <section className="rounded-md border border-[#51689A]/35 bg-[#FEF9F9] px-4 py-6 shadow-sm dark:border-[#383F58] dark:bg-[#1A2036] sm:mx-3 sm:px-7">
        {highlightSession ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-3">
              <p className="font-semibold text-[#1B2065] dark:text-[#EEF4F7]">
                {isAr
                  ? "لديك حصة مجدولة اليوم"
                  : "You have a session scheduled today"}
              </p>
              <p className="ps-8 text-xs text-[#51689A] dark:text-[#9BA8C4]">
                {formatSessionSubtitle(
                  highlightSession,
                  locale,
                  isAr ? "التاريخ" : "Date"
                )}
              </p>
            </div>
            <Button
              type="button"
              className="h-9 shrink-0 rounded-md bg-[#51689A] px-8 text-sm font-medium text-white shadow-md hover:bg-[#51689A]/90"
              onClick={() => void startWorking(highlightSession)}
            >
              <CirclePlay className="me-3 size-4" strokeWidth={2} />
              {isAr ? "بدء الحصة" : "Start Session"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
            {isAr
              ? "لا توجد حصة مجدولة اليوم."
              : "No session scheduled today."}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-bold">
            {isAr ? "جدولة حصة" : "Schedule session"}
          </h2>
          <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
            {isAr
              ? "اطلب تعويضًا أو حصة إضافية"
              : "Request a replacement or extra session"}
          </p>
        </div>
        <div className="flex w-full justify-center">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-11/12 max-w-xl rounded-md border border-[#1B2065]/70 bg-[#FEF9F9] text-sm font-medium text-[#1B2065] shadow-sm hover:bg-[#F6F7FE] dark:border-[#74A7BD]/70 dark:bg-[#1A2036] dark:text-[#EEF4F7]"
            onClick={() => setShowScheduleForm(true)}
          >
            <CalendarCheck className="me-3 size-4" />
            {isAr ? "جدولة حصة إضافية" : "Schedule Extra Session"}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-bold">
            {isAr ? "طلب حصة أستاذ" : "Request a professors session"}
          </h2>
          <p className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
            {isAr
              ? "اطلب حصة من أستاذ آخر"
              : "Request a session from a fellow professor"}
          </p>
        </div>
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full max-w-xs justify-between rounded-lg border border-[#51689A]/35 bg-white px-3 text-xs font-medium text-[#1B2065F2] shadow-sm hover:bg-[#FDFDFF] dark:border-[#383F58] dark:bg-[#1A2036] dark:text-[#EEF4F7] dark:hover:bg-[#242A40]"
                aria-label={isAr ? "اختر أستاذًا" : "Professor"}
              >
                <span className="min-w-0 truncate text-start">
                  {requestedProfessorLabel}
                </span>
                <ChevronDown className="ms-2 size-4 shrink-0 text-[#51689A] dark:text-[#9BA8C4]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="max-h-72 overflow-y-auto border border-slate-200/40 bg-popover shadow-lg backdrop-blur-xl dark:border-[#383F58] dark:bg-[#242A40]"
            >
              <DropdownMenuItem
                onClick={() => setRequestedProfessorId("")}
                className="text-[#51689A] dark:text-[#9BA8C4]"
              >
                {isAr ? "اختر أستاذًا" : "Select professor"}
              </DropdownMenuItem>
              {professors.length === 0 ? (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  {isAr ? "لا يوجد أساتذة آخرون" : "No other professors"}
                </DropdownMenuItem>
              ) : (
                professors.map((professor) => (
                  <DropdownMenuItem
                    key={professor.id}
                    onClick={() => setRequestedProfessorId(String(professor.id))}
                    className="text-[#1B2065F2] dark:text-[#EEF4F7]"
                  >
                    <span className="min-w-0 truncate">
                      {professor.full_name?.trim() ||
                        professor.email?.trim() ||
                        `Professor #${professor.id}`}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            variant="outline"
            disabled
            className="h-10 w-11/12 rounded-md border border-[#1B2065]/70 bg-[#FEF9F9] text-sm font-medium text-[#1B2065] opacity-80 shadow-sm disabled:cursor-not-allowed dark:border-[#74A7BD]/70 dark:bg-[#1A2036] dark:text-[#EEF4F7]"
            title={
              isAr
                ? "واجهة فقط إلى أن يصبح المسار الخلفي جاهزًا"
                : "UI only until the backend endpoint is ready"
            }
          >
            <CirclePlay className="me-3 size-4" />
            {isAr ? "طلب حصة" : "Request Session"}
          </Button>
        </div>
      </section>

      <Dialog
        open={showScheduleForm}
        onOpenChange={(open) => {
          setShowScheduleForm(open);
          if (open) {
            const s = dayjs(`${todayLocalIso()}T08:00:00`).add(1, "day");
            setSessionStart(s);
            setSessionEnd(s.add(2, "hour"));
            setClassRoom("");
            setNewAssignmentId("");
          }
        }}
      >
        <DialogContent
          overlayClassName=" fixed inset-0 z-50 bg-[#1B2065]/80 duration-100 supports-backdrop-filter:backdrop-blur-xl data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          className="max-h-[min(92dvh,760px)] w-full min-w-0 overflow-x-hidden overflow-y-auto border-0 border-[#383F58] bg-white p-4 shadow-xl dark:border dark:bg-[#1A2036] sm:max-w-lg sm:p-6"
          showCloseButton
          onPointerDownOutside={(e) => {
            if (isScheduleFormPortaledLayerTarget(e.target)) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (isScheduleFormPortaledLayerTarget(e.target)) e.preventDefault();
          }}
          onFocusOutside={(e) => {
            if (isScheduleFormPortaledLayerTarget(e.target)) e.preventDefault();
          }}
        >
          <DialogHeader className="gap-1">
            <DialogTitle className="text-lg font-bold text-[#1B2065] dark:text-[#EEF4F7]">
              {isAr ? "جدولة حصتك" : "Schedule your session"}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#51689A] dark:text-[#9BA8C4]">
              {isAr
                ? "أدخل التفاصيل لبدء الحصة."
                : "Fill in the details to start your session."}
            </DialogDescription>
            {assignments.length === 0 && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
                {isAr
                  ? "لا توجد تعيينات تدريس لهذا الحساب. إنشاء «شعبة» وحدها لا يكفي: اربط حساب الأستاذ بالشعبة والمادة عبر تعيين تدريس (Teaching assignment) في لوحة الإدارة."
                  : "No teaching assignments for this login. Creating a group alone is not enough: add a Teaching assignment linking your teacher to that group and a module in admin."}
              </p>
            )}
          </DialogHeader>
          <ScheduleSessionForm
            isAr={isAr}
            assignments={assignments}
            assignmentId={newAssignmentId}
            onAssignmentIdChange={setNewAssignmentId}
            classRoom={classRoom}
            onClassRoomChange={setClassRoom}
            sessionStart={sessionStart}
            onSessionStartChange={(v) => v && setSessionStart(v)}
            sessionEnd={sessionEnd}
            onSessionEndChange={(v) => v && setSessionEnd(v)}
          />
          <DialogFooter className="relative z-10 mt-2 flex w-full flex-col items-center justify-center gap-0 sm:justify-center">
            <Button
              type="button"
              className="h-12 w-full max-w-sm cursor-pointer self-center rounded-full bg-[#51689A] text-base font-medium text-white shadow-sm hover:bg-[#51689A]/90 disabled:cursor-not-allowed disabled:opacity-60 p-2"
              onClick={() => void createSession()}
              disabled={creating || newAssignmentId === ""}
            >
              <span className="inline-flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-[#1A2036]/15">
                  <Play className="size-4 fill-white text-white" />
                </span>
                {creating
                  ? isAr
                    ? "جارٍ الإنشاء…"
                    : "Creating…"
                  : isAr
                    ? "إنشاء الحصة"
                    : "Create session"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
