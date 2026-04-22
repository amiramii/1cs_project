import dayjs from "dayjs";
import type { AttendanceStatus } from "@/lib/professorSessionData";
import type { SessionApi } from "@/lib/professorSessionData";

/** Synthetic session ids so the UI can detect demo rows. */
export const DEMO_SEMESTRIAL_SESSION_ID_BASE = 9_300_000;

type MatrixRow = {
  id: number;
  name: string;
  email: string;
  cells: (AttendanceStatus | null)[];
  present: number;
  absent: number;
  justified: number;
};

/**
 * Builds a full semestrial grid (sessions × students) for UI when the API has
 * no rows for this assignment/period.
 */
export function buildSemestrialDemoMatrix(
  assignmentId: number,
  from: string,
  to: string,
  isAr: boolean
): { courseSessions: SessionApi[]; rows: MatrixRow[] } {
  const dates = pickDemoDatesInRange(from, to, 5);
  const courseSessions: SessionApi[] = dates.map((date, i) => ({
    id: DEMO_SEMESTRIAL_SESSION_ID_BASE + i + 1,
    assignment: assignmentId,
    date,
    start_time: "09:00:00",
    end_time: "11:00:00",
    module_name: "Module demo",
    group_name: "G-Demo",
  }));

  const nSess = courseSessions.length;
  const studSpecs: Array<{
    id: number;
    name: string;
    email: string;
    pattern: AttendanceStatus[];
  }> = [
    {
      id: 501,
      name: isAr ? "بخاري ايمين دعاء" : "Boukhari Imene Douaa",
      email: "HBF0004@student.univ.dz",
      pattern: ["present", "absent", "present", "justified", "absent"],
    },
    {
      id: 502,
      name: isAr ? "طالب تجريبي" : "Demo Student",
      email: "student.demo@student.univ.dz",
      pattern: ["absent", "present", "present", "present", "present"],
    },
    {
      id: 503,
      name: isAr ? "مستعمل تجريبي" : "Test User",
      email: "test.user@student.univ.dz",
      pattern: ["justified", "absent", "present", "absent", "justified"],
    },
    {
      id: 504,
      name: isAr ? "طالب رابع" : "Other Student",
      email: "STU2001@student.univ.dz",
      pattern: ["present", "present", "absent", "present", "absent"],
    },
  ];

  const rows: MatrixRow[] = studSpecs.map((st) => {
    const cells: (AttendanceStatus | null)[] = [];
    for (let i = 0; i < nSess; i++) {
      cells.push(st.pattern[i % st.pattern.length] ?? "present");
    }
    let p = 0;
    let a = 0;
    let j = 0;
    for (const c of cells) {
      if (c === "present") p++;
      else if (c === "absent") a++;
      else if (c === "justified") j++;
    }
    return {
      id: st.id,
      name: st.name,
      email: st.email,
      cells,
      present: p,
      absent: a,
      justified: j,
    };
  });
  rows.sort((a, b) =>
    a.name.localeCompare(b.name, isAr ? "ar" : "en", { sensitivity: "base" })
  );

  return { courseSessions, rows };
}

function pickDemoDatesInRange(
  from: string,
  to: string,
  count: number
): string[] {
  const start = dayjs(from);
  const end = dayjs(to);
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
    return [from];
  }
  const out: string[] = [];
  let cur = start;
  let guard = 0;
  while (out.length < count && guard < 20 && !cur.isAfter(end)) {
    out.push(cur.format("YYYY-MM-DD"));
    cur = cur.add(5, "day");
    guard += 1;
  }
  if (out.length === 0) out.push(start.format("YYYY-MM-DD"));
  return out;
}

export function isDemoSemestrialMatrix(matrix: {
  courseSessions: SessionApi[];
} | null): boolean {
  const id = matrix?.courseSessions[0]?.id;
  return typeof id === "number" && id >= DEMO_SEMESTRIAL_SESSION_ID_BASE;
}
