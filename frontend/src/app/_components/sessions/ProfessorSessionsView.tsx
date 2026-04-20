"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpFromLine,
  CalendarPlus,
  ChevronRight,
  CirclePlay,
  Info,
  Play,
  Save,
  Search,
} from "lucide-react";
import { getAccessToken } from "@/lib/tokenStorage";
import { apiUnreachableMessage, isNetworkFailure } from "@/lib/fetchErrors";
import { useLanguage } from "@/app/_components/language-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notifyUser } from "@/lib/utils";
import {
  buildMockProfSession,
  isMockProfSessionId,
  isProfSessionMockEnabled,
} from "@/app/_components/sessions/profSessionMock";

type AttendanceStatus = "present" | "absent" | "justified";

type AttendanceRow = {
  id: number;
  session?: number;
  student: number;
  student_name?: string;
  student_email?: string;
  status: AttendanceStatus;
};

type SessionApi = {
  id: number;
  assignment: number;
  date: string;
  start_time: string;
  end_time: string;
  module_name?: string;
  group_name?: string;
  attendances?: AttendanceRow[];
};

type AssignmentApi = {
  id: number;
  group_name?: string;
  module_name?: string;
};

/** Rows shown per page before “show more” on the attendance sheet (large groups). */
const SHEET_PAGE_SIZE = 12;

function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(
    /\/+$/,
    ""
  );
}

function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && "results" in raw) {
    const r = (raw as { results?: T[] }).results;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

function todayLocalIso(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
  return `${mod} - ${grp} - ${dateLabel}`;
}

/** Column header like "Tue 13-Jan" */
function formatSessionColumnDate(
  s: SessionApi,
  locale: string
): string {
  try {
    const dt = new Date(s.date + "T12:00:00");
    return dt.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return "—";
  }
}

function padTimeForApi(t: string): string {
  if (!t) return "09:00:00";
  return t.length === 5 ? `${t}:00` : t;
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
  const locale = isAr ? "ar-DZ" : "en-US";
  const apiBase = apiBaseUrl();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentApi[]>([]);
  const [sessions, setSessions] = useState<SessionApi[]>([]);
  /** All attendance rows for the teacher — used for absence counts across sessions */
  const [teacherAttendanceRows, setTeacherAttendanceRows] = useState<
    AttendanceRow[]
  >([]);

  const [workingSession, setWorkingSession] = useState<SessionApi | null>(null);
  const [pendingEdits, setPendingEdits] = useState<
    Record<number, AttendanceStatus>
  >({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [sheetShowAll, setSheetShowAll] = useState(false);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newAssignmentId, setNewAssignmentId] = useState<number | "">("");
  const [newDate, setNewDate] = useState(todayLocalIso());
  const [newStart, setNewStart] = useState("08:00");
  const [newEnd, setNewEnd] = useState("10:00");
  const [creating, setCreating] = useState(false);

  const refreshData = useCallback(async () => {
    const token = getAccessToken();
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    let aRes: Response;
    let sRes: Response;
    let attRes: Response;
    try {
      [aRes, sRes, attRes] = await Promise.all([
        fetch(`${apiBase}/api/academic/teaching-assignments/?page_size=100`, {
          headers,
        }),
        fetch(`${apiBase}/api/attendance/sessions/?page_size=100`, { headers }),
        fetch(`${apiBase}/api/attendance/attendance/?page_size=500`, {
          headers,
        }),
      ]);
    } catch (e) {
      setAssignments([]);
      setSessions([]);
      setTeacherAttendanceRows([]);
      if (isNetworkFailure(e)) {
        throw new Error(apiUnreachableMessage(apiBase, isAr));
      }
      throw e;
    }
    const aText = await aRes.text();
    const sText = await sRes.text();
    const attText = await attRes.text();
    let aParsed: unknown = null;
    let sParsed: unknown = null;
    let attParsed: unknown = null;
    try {
      aParsed = aText ? JSON.parse(aText) : null;
    } catch {
      aParsed = null;
    }
    try {
      sParsed = sText ? JSON.parse(sText) : null;
    } catch {
      sParsed = null;
    }
    try {
      attParsed = attText ? JSON.parse(attText) : null;
    } catch {
      attParsed = null;
    }
    if (!aRes.ok) {
      throw new Error(
        isAr
          ? "تعذر تحميل التعيينات التدريسية."
          : "Could not load teaching assignments."
      );
    }
    if (!sRes.ok) {
      throw new Error(isAr ? "تعذر تحميل الحصص." : "Could not load sessions.");
    }
    setAssignments(unwrapList<AssignmentApi>(aParsed));
    setSessions(unwrapList<SessionApi>(sParsed));
    if (attRes.ok) {
      setTeacherAttendanceRows(unwrapList<AttendanceRow>(attParsed));
    }
  }, [apiBase, isAr]);

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
              : isAr
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
  }, [refreshData, isAr]);

  const todayStr = todayLocalIso();

  /** Merge a dev mock session when there is no real session today (for UI coding). */
  const sessionsDisplay = useMemo(() => {
    if (!isProfSessionMockEnabled()) return sessions;
    const realToday = sessions.filter(
      (s) => s.date === todayStr && !isMockProfSessionId(s.id)
    );
    if (realToday.length > 0) {
      return sessions.filter((s) => !isMockProfSessionId(s.id));
    }
    const rest = sessions.filter((s) => !isMockProfSessionId(s.id));
    return [buildMockProfSession(), ...rest];
  }, [sessions, todayStr]);

  const todaySessions = useMemo(() => {
    return sessionsDisplay
      .filter((s) => s.date === todayStr)
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
  }, [sessionsDisplay, todayStr]);

  const highlightSession = todaySessions[0] ?? null;

  const startWorking = async (
    s: SessionApi,
    opts?: { resetFeedback?: boolean }
  ) => {
    const resetFeedback = opts?.resetFeedback !== false;
    if (isMockProfSessionId(s.id)) {
      const full = buildMockProfSession();
      setWorkingSession(full);
      const next: Record<number, AttendanceStatus> = {};
      (full.attendances ?? []).forEach((a) => {
        next[a.id] = a.status;
      });
      setPendingEdits(next);
      if (resetFeedback) setSaveMsg(null);
      setTableSearch("");
      setSheetShowAll(false);
      if (resetFeedback) {
        void notifyUser({
          title: isAr ? "حصة (تجريبي)" : "Session (demo)",
          body: formatSessionSubtitle(
            full,
            locale,
            isAr ? "التاريخ" : "Date"
          ),
          tag: `session-open-${full.id}`,
        });
      }
      return;
    }
    const token = getAccessToken();
    let full: SessionApi = s;
    try {
      const res = await fetch(`${apiBase}/api/attendance/sessions/${s.id}/`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      if (res.ok) {
        full = (await res.json()) as SessionApi;
      }
    } catch {
      /* use list payload */
    }
    setWorkingSession(full);
    const next: Record<number, AttendanceStatus> = {};
    (full.attendances ?? []).forEach((a) => {
      next[a.id] = a.status;
    });
    setPendingEdits(next);
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

  const effectiveStatus = (row: AttendanceRow): AttendanceStatus =>
    pendingEdits[row.id] ?? row.status;

  const sessionIdsForCourse = useMemo(() => {
    if (!workingSession) return new Set<number>();
    return new Set(
      sessionsDisplay
        .filter((s) => s.assignment === workingSession.assignment)
        .map((s) => s.id)
    );
  }, [sessionsDisplay, workingSession]);

  /** Cumulative absence events (status `absent`) for this module/group across loaded sessions */
  const absenceCountByStudent = useMemo(() => {
    const map = new Map<number, number>();
    for (const row of teacherAttendanceRows) {
      if (row.session === undefined) continue;
      if (!sessionIdsForCourse.has(row.session)) continue;
      if (row.status !== "absent") continue;
      map.set(row.student, (map.get(row.student) ?? 0) + 1);
    }
    return map;
  }, [teacherAttendanceRows, sessionIdsForCourse]);

  const stats = useMemo(() => {
    const rows = workingSession?.attendances ?? [];
    if (rows.length === 0) {
      return { present: 0, absent: 0, justified: 0 };
    }
    let p = 0,
      a = 0,
      j = 0;
    rows.forEach((r) => {
      const st = pendingEdits[r.id] ?? r.status;
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
  }, [workingSession, pendingEdits]);

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

  const sheetRowsVisible = useMemo(() => {
    if (sheetShowAll) return filteredRows;
    return filteredRows.slice(0, SHEET_PAGE_SIZE);
  }, [filteredRows, sheetShowAll]);

  const setRowStatus = (attendanceId: number, status: AttendanceStatus) => {
    setPendingEdits((prev) => ({ ...prev, [attendanceId]: status }));
  };

  const saveAttendance = async () => {
    if (!workingSession) return;
    if (isMockProfSessionId(workingSession.id)) {
      setSaveMsg(
        isAr
          ? "جلسة تجريبية — لا يُحفظ في الخادم. عطّلها بـ NEXT_PUBLIC_DEV_MOCK_PROF_SESSION=false أو أنشئ حصة حقيقية."
          : "Demo session — not saved to the server. Set NEXT_PUBLIC_DEV_MOCK_PROF_SESSION=false or create a real session."
      );
      return;
    }
    const token = getAccessToken();
    const rows = workingSession.attendances ?? [];
    const changed = rows.filter((r) => {
      const next = pendingEdits[r.id];
      return next !== undefined && next !== r.status;
    });
    if (changed.length === 0) {
      setSaveMsg(
        isAr ? "لا توجد تغييرات لحفظها." : "No changes to save."
      );
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      for (const row of changed) {
        const status = pendingEdits[row.id] ?? row.status;
        const res = await fetch(
          `${apiBase}/api/attendance/attendance/${row.id}/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ status }),
          }
        );
        if (!res.ok) {
          throw new Error(await res.text());
        }
      }
      await refreshData();
      const detailRes = await fetch(
        `${apiBase}/api/attendance/sessions/${workingSession.id}/`,
        { headers: { ...(token && { Authorization: `Bearer ${token}` }) } }
      );
      if (detailRes.ok) {
        const fresh = (await detailRes.json()) as SessionApi;
        await startWorking(fresh, { resetFeedback: false });
        setSaveMsg(
          isAr ? "تم حفظ الغياب والحضور." : "Attendance & absences saved."
        );
        void notifyUser({
          title: isAr ? "تم الحفظ" : "Saved",
          body: isAr
            ? "تم تحديث الحضور والغياب لهذه الحصة."
            : "Attendance for this session was updated.",
          tag: `session-save-${workingSession.id}`,
        });
      }
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
      `session_${workingSession.date}`,
      "absence_count_course",
    ];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.student_email?.split("@")[0] ?? r.student,
          `"${(r.student_name ?? "").replace(/"/g, '""')}"`,
          `"${(r.student_email ?? "").replace(/"/g, '""')}"`,
          effectiveStatus(r),
          absenceCountByStudent.get(r.student) ?? 0,
        ].join(",")
      ),
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
    const token = getAccessToken();
    setCreating(true);
    try {
      const res = await fetch(`${apiBase}/api/attendance/sessions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          assignment: newAssignmentId,
          date: newDate,
          start_time: padTimeForApi(newStart),
          end_time: padTimeForApi(newEnd),
          extra_fields: [],
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || "create failed");
      }
      await refreshData();
      setShowScheduleForm(false);
      let created: SessionApi | null = null;
      try {
        created = text ? (JSON.parse(text) as SessionApi) : null;
      } catch {
        created = null;
      }
      if (created?.id) {
        // Opening the new session also triggers `notifyUser` inside `startWorking`
        // when `resetFeedback` is true (default), so we do not notify twice here.
        await startWorking(created);
      }
    } catch (e) {
      console.error(e);
      setLoadError(isAr ? "تعذر إنشاء الحصة." : "Could not create session.");
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

  const sessionColLabel = workingSession
    ? formatSessionColumnDate(workingSession, locale)
    : "";

  if (loading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-[#D6DEEF] bg-white/80 dark:bg-card">
        <p className="text-sm text-[#5A6B82]">
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
    return (
      <div className="w-full max-w-6xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#D6DEEF] pb-5">
          <div className="min-w-0 space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-[#2D3748] dark:text-[#E8EEF7]">
              {isAr ? "ورقة الحضور والغياب" : "Semestrial Attendance Sheet"}
            </h2>
            <p className="text-sm text-[#718096] dark:text-muted-foreground">
              {sheetTitle}
            </p>
            <p className="text-xs text-[#5A6B82]">
              {isAr
                ? "سجّل الغياب والحضور لكل طالب، ثم احفظ. يمكن تصدير الورقة كملف."
                : "Record presence and absences for each student, then save. Export the sheet as needed."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg border-2 border-[#2D3748] bg-white px-4 text-[#2D3748] hover:bg-[#2D3748]/5 dark:border-[#94A3B8] dark:bg-transparent dark:text-foreground"
              onClick={exportCsv}
            >
              <ArrowUpFromLine className="size-4" />
              {isAr ? "تصدير" : "Export"}
            </Button>
            <Button
              type="button"
              className="h-10 rounded-lg bg-[#2D3748] px-5 text-white hover:bg-[#1e293b] dark:bg-[#334155]"
              onClick={() => void saveAttendance()}
              disabled={saving}
            >
              <Save className="size-4" />
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#74CFC4]/70 bg-white px-4 py-4 text-center shadow-sm dark:bg-card">
            <p className="text-2xl font-bold text-[#2A9D8F]">{stats.present}%</p>
            <p className="text-sm font-medium text-[#2A9D8F]/90">
              {isAr ? "حاضر" : "Present"}
            </p>
          </div>
          <div className="rounded-xl border border-[#E76F51]/60 bg-white px-4 py-4 text-center shadow-sm dark:bg-card">
            <p className="text-2xl font-bold text-[#E76F51]">{stats.absent}%</p>
            <p className="text-sm font-medium text-[#E76F51]/90">
              {isAr ? "غائب" : "Absent"}
            </p>
          </div>
          <div className="rounded-xl border border-[#2D3748]/25 bg-white px-4 py-4 text-center shadow-sm dark:bg-card">
            <p className="text-2xl font-bold text-[#2D3748] dark:text-[#CBD5E1]">
              {stats.justified}%
            </p>
            <p className="text-sm font-medium text-[#4A5568] dark:text-muted-foreground">
              {isAr ? "مبرر" : "Justified"}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#D6DEEF] bg-white shadow-sm dark:border-border dark:bg-card">
          <div className="flex flex-wrap items-center justify-end gap-2 border-b border-[#E8EEF7] p-3">
            <div className="relative w-full min-w-[200px] max-w-sm sm:max-w-xs">
              <Search className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-[#718096]" />
              <Input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder={isAr ? "بحث عن طالب…" : "Search students…"}
                className="h-10 rounded-full border-[#D6DEEF] bg-[#F7FAFC] ps-10 pe-4 text-sm text-[#2D3748] ring-offset-2 focus-visible:ring-[#5B8FA8]/40 dark:bg-background"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#5B8FA8] text-white">
                  <th className="px-3 py-3 text-start font-semibold">
                    {isAr ? "المعرّف" : "User ID"}
                  </th>
                  <th className="px-3 py-3 text-start font-semibold">
                    {isAr ? "الاسم" : "Name"}
                  </th>
                  <th className="px-3 py-3 text-center font-semibold">
                    {sessionColLabel}
                  </th>
                  <th className="px-3 py-3 text-center font-semibold">
                    {isAr ? "مجموع الغياب" : "Absence count"}
                  </th>
                  <th className="w-10 px-1 py-3 text-center" aria-hidden>
                    <ChevronRight className="mx-auto size-4 opacity-70" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sheetRowsVisible.map((row) => {
                  const st = effectiveStatus(row);
                  const cumAbs = absenceCountByStudent.get(row.student) ?? 0;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-[#E8EEF7] odd:bg-[#FAFCFF] dark:odd:bg-muted/20"
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-[#2D3748]">
                        {row.student_email?.split("@")[0] ?? row.student}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 text-[#2D3748] dark:text-foreground">
                        {row.student_name ?? row.student_email ?? "—"}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap justify-center gap-1">
                          {(
                            [
                              ["present", "P", "#2A9D8F"],
                              ["absent", "A", "#E76F51"],
                              ["justified", "J", "#2D3748"],
                            ] as const
                          ).map(([key, letter, color]) => (
                            <Button
                              key={key}
                              type="button"
                              variant="ghost"
                              title={
                                key === "present"
                                  ? isAr
                                    ? "حاضر"
                                    : "Present"
                                  : key === "absent"
                                    ? isAr
                                      ? "غائب"
                                      : "Absent"
                                    : isAr
                                      ? "غياب مبرر"
                                      : "Justified absence"
                              }
                              onClick={() =>
                                setRowStatus(row.id, key as AttendanceStatus)
                              }
                              className="h-auto min-h-9 min-w-9 rounded-md p-0 text-sm font-bold transition-transform hover:scale-105 hover:bg-transparent"
                              style={{
                                backgroundColor:
                                  st === key ? color : `${color}18`,
                                color: st === key ? "#fff" : color,
                                border:
                                  st === key
                                    ? `2px solid ${color}`
                                    : `1px solid ${color}40`,
                              }}
                            >
                              {letter}
                            </Button>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold tabular-nums text-[#4A5568]">
                        {cumAbs}
                      </td>
                      <td />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredRows.length > SHEET_PAGE_SIZE && (
            <div className="flex justify-end border-t border-[#E8EEF7] p-3">
              <Button
                type="button"
                variant="secondary"
                className="rounded-lg bg-[#2D3748] text-white hover:bg-[#1e293b]"
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

        {saveMsg && (
          <Alert
            variant={
              saveMsg.includes("فشل") || /failed/i.test(saveMsg)
                ? "destructive"
                : "default"
            }
            className={
              saveMsg.includes("تجريبية") || saveMsg.includes("Demo")
                ? "border-amber-500/40 bg-amber-500/10"
                : saveMsg.includes("فشل") || /failed/i.test(saveMsg)
                  ? undefined
                  : "border-emerald-500/35 bg-emerald-500/10"
            }
          >
            <Info aria-hidden />
            <div className="min-w-0 flex-1 space-y-1">
              <AlertTitle>
                {saveMsg.includes("فشل") || /failed/i.test(saveMsg)
                  ? isAr
                    ? "خطأ"
                    : "Error"
                  : saveMsg.includes("تجريبية") || saveMsg.includes("Demo")
                    ? isAr
                      ? "تنبيه"
                      : "Heads up"
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
            className="rounded-lg border-[#D6DEEF]"
            onClick={() => {
              setWorkingSession(null);
              setPendingEdits({});
              setSaveMsg(null);
            }}
          >
            {isAr ? "← الخروج من الحصة" : "← Exit session"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-[#2D3748] dark:text-foreground">
          {isAr ? "حصصك" : "Your Sessions"}
        </h1>
        <p className="text-[15px] text-[#718096] dark:text-muted-foreground">
          {isAr
            ? "أنشئ الحصص وأدر الحضور."
            : "Create sessions and manage attendance."}
        </p>
        <p className="text-xs text-[#718096]/90">
          <Link
            href="/Scheduals"
            className="font-medium text-[#51689A] underline-offset-4 hover:underline"
          >
            {isAr
              ? "جداول PDF: من تبويب «الجداول»"
              : "PDF timetables: use the Schedules tab"}
          </Link>
        </p>
      </header>

      {highlightSession && (
        <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#51689A]/55 bg-white p-5 shadow-sm dark:border-[#51689A]/45 dark:bg-card sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="font-bold text-[#2D3748] dark:text-foreground">
              {isAr
                ? "لديك حصة مجدولة اليوم"
                : "You have a session scheduled today"}
            </p>
            <p className="text-sm text-[#718096] dark:text-muted-foreground">
              {formatSessionSubtitle(
                highlightSession,
                locale,
                isAr ? "التاريخ" : "Date"
              )}
            </p>
          </div>
          <Button
            type="button"
            className="h-12 shrink-0 rounded-full bg-[#2D3748] px-8 text-white hover:bg-[#1e293b] dark:bg-[#334155]"
            onClick={() => void startWorking(highlightSession)}
          >
            <span className="inline-flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
                <Play className="size-4 fill-white text-white" />
              </span>
              {isAr ? "بدء الحصة" : "Start Session"}
            </span>
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-[#D6DEEF] bg-[#F4F7FB] p-10 text-center shadow-inner dark:border-border dark:bg-muted/40">
        <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-[#D4E8F2] dark:bg-muted">
          <CirclePlay className="size-10 text-[#5B8FA8]" strokeWidth={1.25} />
        </div>
        <h2 className="text-lg font-semibold text-[#5B8FA8] dark:text-[#93C5D8]">
          {isAr ? "لا توجد حصة نشطة" : "No Active Session"}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#718096] dark:text-muted-foreground">
          {isAr
            ? "ابدأ حصة جديدة لتتبع الحضور. اختر الشعبة والمادة والتاريخ للبدء، أو استخدم حصة اليوم أعلاه."
            : "Start a new session to start tracking attendance. Select a group, a module and a date to get started."}
        </p>
      </div>

      {showScheduleForm && (
        <div className="space-y-4 rounded-2xl border border-[#D6DEEF] bg-[#F7FAFC] p-5 dark:border-border dark:bg-muted/30">
          <p className="font-semibold text-[#2D3748]">
            {isAr ? "جدولة حصة إضافية" : "Schedule extra session"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[#5A6B82]">
              {isAr ? "المادة / الشعبة" : "Module / group"}
              <Select
                value={
                  newAssignmentId === ""
                    ? undefined
                    : String(newAssignmentId)
                }
                onValueChange={(v) =>
                  setNewAssignmentId(v ? Number(v) : "")
                }
              >
                <SelectTrigger className="mt-1.5 h-11 w-full rounded-2xl border-[#D6DEEF] bg-white px-3 text-sm text-[#2D3748] dark:bg-background">
                  <SelectValue placeholder={isAr ? "اختر…" : "Choose…"} />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {(a.module_name ?? "?") + " — " + (a.group_name ?? "?")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="block text-xs font-medium text-[#5A6B82]">
              {isAr ? "التاريخ" : "Date"}
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="mt-1.5 h-11 rounded-2xl border-[#D6DEEF] bg-white px-3 text-sm dark:bg-background"
              />
            </label>
            <label className="block text-xs font-medium text-[#5A6B82]">
              {isAr ? "البداية" : "Start"}
              <Input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="mt-1.5 h-11 rounded-2xl border-[#D6DEEF] bg-white px-3 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-[#5A6B82]">
              {isAr ? "النهاية" : "End"}
              <Input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="mt-1.5 h-11 rounded-2xl border-[#D6DEEF] bg-white px-3 text-sm"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-lg bg-[#2D3748] text-white"
              onClick={() => void createSession()}
              disabled={creating || newAssignmentId === ""}
            >
              {creating
                ? isAr
                  ? "جارٍ الإنشاء…"
                  : "Creating…"
                : isAr
                  ? "تأكيد"
                  : "Confirm"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowScheduleForm(false)}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="h-14 w-full rounded-xl border-2 border-[#2D3748] bg-white text-base font-medium text-[#2D3748] hover:bg-[#2D3748]/5 dark:bg-transparent dark:text-foreground"
        onClick={() => setShowScheduleForm((v) => !v)}
      >
        <CalendarPlus className="me-2 size-5" />
        {isAr ? "جدولة حصة إضافية" : "Schedule Extra Session"}
      </Button>

      {sessionsDisplay.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-[#2D3748] dark:text-foreground">
            {isAr ? "كل الحصص" : "All sessions"}
          </p>
          {isProfSessionMockEnabled() &&
            sessionsDisplay.some((s) => isMockProfSessionId(s.id)) && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {isAr
                  ? "تظهر حصة تجريبية في وضع التطوير فقط."
                  : "A demo session appears in development only."}
              </p>
            )}
          <ul className="space-y-2">
            {sessionsDisplay.map((s) => (
              <li key={s.id}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void startWorking(s)}
                  className="h-auto w-full justify-between rounded-xl border border-[#E8EEF7] bg-white px-4 py-3 text-left text-sm font-normal text-[#2D3748] transition hover:border-[#5B8FA8]/50 hover:bg-[#F7FAFC] dark:bg-card dark:text-foreground dark:hover:bg-muted/30"
                >
                  <span className="font-medium">
                    {formatSessionSubtitle(s, locale, "")}
                  </span>
                  <span className="text-[#5B8FA8]">
                    <ChevronRight className="size-5 rtl:rotate-180" />
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
