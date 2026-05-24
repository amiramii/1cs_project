import type { AttendanceRow } from "@/lib/professorSessionData";
import { getStudentById } from "@/lib/checkinClient";

type Mini = { student_name: string; student_email: string };

/** In-memory cache for one page session (avoid N duplicate fetches). */
const profileCache = new Map<number, Mini | null>();

const inflight = new Map<number, Promise<Mini | null>>();

async function fetchStudentMini(studentPk: number): Promise<Mini | null> {
  if (profileCache.has(studentPk)) return profileCache.get(studentPk)!;
  const existing = inflight.get(studentPk);
  if (existing) return existing;

  const p = (async () => {
    try {
      const res = await getStudentById(studentPk);
      if (!res.ok) return null;
      const raw = (await res.json()) as Record<string, unknown>;
      const name =
        typeof raw.full_name === "string" ? raw.full_name.trim() || "—" : "—";
      const mail =
        typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
      return { student_name: name, student_email: mail };
    } catch {
      return null;
    } finally {
      inflight.delete(studentPk);
    }
  })();

  inflight.set(studentPk, p);
  const v = await p;
  profileCache.set(studentPk, v);
  return v;
}

const BATCH = 12;

/**
 * Django does not expose `student_name` / `student_email` on attendance payloads.
 * The list serializer for students omits Student PK from some responses, so we map
 * `Attendance.student` (Student FK) → `GET /api/students/{id}/` for display on the sheet.
 */
export async function hydrateAttendanceRowsStudentInfo(
  rows: AttendanceRow[]
): Promise<AttendanceRow[]> {
  if (!rows.length) return rows;
  const ids = [...new Set(rows.map((r) => r.student).filter((x): x is number => typeof x === "number"))];
  for (let i = 0; i < ids.length; i += BATCH) {
    const slice = ids.slice(i, i + BATCH);
    await Promise.all(slice.map((id) => fetchStudentMini(id)));
  }
  return rows.map((row) => {
    if (typeof row.student !== "number") return row;
    const hasName = Boolean(row.student_name?.trim());
    const hasEmail = Boolean(row.student_email?.trim());
    if (hasName && hasEmail) return row;
    const mini = profileCache.get(row.student);
    if (!mini) return row;
    return {
      ...row,
      student_name: row.student_name ?? mini.student_name,
      student_email: row.student_email ?? mini.student_email,
    };
  });
}

/** Call when logout / leaving professor sessions area if desired; avoids stale RAM. */
export function clearAttendanceStudentProfileCache(): void {
  profileCache.clear();
  inflight.clear();
}
