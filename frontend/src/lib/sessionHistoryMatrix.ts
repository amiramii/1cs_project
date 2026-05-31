import { isIsoDateInRange } from "@/lib/semesterAcademic";
import type {
  AttendanceRow,
  AttendanceStatus,
  SessionApi,
} from "@/lib/professorSessionData";

export function shortDateHeader(s: SessionApi, locale: string) {
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

export function buildSessionHistoryMatrix(
  assignmentId: number,
  from: string,
  to: string,
  allSessions: SessionApi[],
  attendance: AttendanceRow[],
  isAr: boolean
) {
  const sessionIdsWithMarks = new Set<number>();
  for (const r of attendance) {
    if (typeof r.session === "number") sessionIdsWithMarks.add(r.session);
  }

  const courseSessions = allSessions
    .filter(
      (s) =>
        s.assignment === assignmentId &&
        (isIsoDateInRange(s.date, from, to) || sessionIdsWithMarks.has(s.id))
    )
    .sort((a, b) =>
      a.date !== b.date
        ? a.date.localeCompare(b.date)
        : a.start_time.localeCompare(b.start_time)
    );

  const sessionIds = new Set(courseSessions.map((s) => s.id));
  const flatById = new Map<number, AttendanceRow>();
  for (const r of attendance) {
    if (typeof r.id === "number") flatById.set(r.id, r);
  }

  const bySession = new Map<number, AttendanceRow[]>();
  for (const session of courseSessions) {
    const sid = session.id;
    const merged: AttendanceRow[] = [];
    const seen = new Set<number>();

    for (const nested of session.attendances ?? []) {
      if (typeof nested.id !== "number") continue;
      const flat = flatById.get(nested.id);
      merged.push({
        ...nested,
        session: sid,
        ...(flat
          ? {
              status: flat.status,
              extra_values: flat.extra_values,
              student_name: flat.student_name ?? nested.student_name,
              student_email: flat.student_email ?? nested.student_email,
            }
          : {}),
      });
      seen.add(nested.id);
    }

    for (const flat of attendance) {
      if (flat.session !== sid || typeof flat.id !== "number") continue;
      if (seen.has(flat.id)) continue;
      merged.push(flat);
      seen.add(flat.id);
    }

    if (merged.length > 0) bySession.set(sid, merged);
  }

  const studSet = new Set<number>();
  for (const g of bySession.values()) {
    g.forEach((r) => studSet.add(r.student));
  }

  const students = [...studSet].map((id) => {
    let name = "—";
    let email = "";
    for (const g of bySession.values()) {
      const row = g.find((x) => x.student === id);
      if (row) {
        name = row.student_name ?? name;
        email = row.student_email ?? email;
        break;
      }
    }
    for (const g of bySession.values()) {
      const row = g.find((x) => x.student === id);
      if (row?.student_name) name = row.student_name;
      if (row?.student_email) email = row.student_email;
    }
    return { id, name, email: email ?? "" };
  });
  students.sort((a, b) =>
    a.name.localeCompare(b.name, isAr ? "ar" : "en", { sensitivity: "base" })
  );

  const cellFor = (
    studentId: number,
    sessionId: number
  ): AttendanceStatus | null => {
    const g = bySession.get(sessionId);
    if (!g) return null;
    const row = g.find((x) => x.student === studentId);
    return row ? row.status : null;
  };

  const rows = students.map((st) => {
    const cells: (AttendanceStatus | null)[] = courseSessions.map((cs) =>
      cellFor(st.id, cs.id)
    );
    let p = 0;
    let a = 0;
    let j = 0;
    for (const c of cells) {
      if (c === "present") p++;
      else if (c === "absent") a++;
      else if (c === "justified") j++;
    }
    return {
      ...st,
      cells,
      present: p,
      absent: a,
      justified: j,
    };
  });

  return { courseSessions, rows };
}

/** % of all cells in a built matrix (P + A + J = 100%). */
export function distributionFromMatrixRows(
  rows: { cells: (AttendanceStatus | null)[] }[]
): { present: number; absent: number; justified: number } {
  let p = 0;
  let a = 0;
  let j = 0;
  for (const r of rows) {
    for (const c of r.cells) {
      if (c === "present") p++;
      else if (c === "absent") a++;
      else if (c === "justified") j++;
    }
  }
  const n = p + a + j;
  if (n === 0) return { present: 0, absent: 0, justified: 0 };
  return {
    present: Math.round((100 * p) / n),
    absent: Math.round((100 * a) / n),
    justified: Math.round((100 * j) / n),
  };
}

/** % of all attendance *marks* in the period (P + A + J = 100%). */
export function overallStatusDistributionPct(
  courseSessions: SessionApi[],
  teacherAttendanceRows: AttendanceRow[]
): { present: number; absent: number; justified: number } {
  const sessionIds = new Set(courseSessions.map((s) => s.id));
  const rel = teacherAttendanceRows.filter(
    (r) => r.session != null && sessionIds.has(r.session)
  );
  let p = 0;
  let a = 0;
  let j = 0;
  for (const r of rel) {
    if (r.status === "present") p++;
    else if (r.status === "absent") a++;
    else if (r.status === "justified") j++;
  }
  const n = p + a + j;
  if (n === 0) return { present: 0, absent: 0, justified: 0 };
  return {
    present: Math.round((100 * p) / n),
    absent: Math.round((100 * a) / n),
    justified: Math.round((100 * j) / n),
  };
}
