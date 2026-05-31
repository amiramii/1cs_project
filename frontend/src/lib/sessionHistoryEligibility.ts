import type { AttendanceRow } from "@/lib/professorSessionData";

/** True when the API has attendance marks for this session (present / justified / points / note). */
export function sessionHasRecordedAttendance(
  sessionId: number,
  attendanceRows: AttendanceRow[]
): boolean {
  const rows = attendanceRows.filter((r) => r.session === sessionId);
  if (rows.length === 0) return false;
  return rows.some((r) => {
    if (r.status === "present" || r.status === "justified") return true;
    const pts = Number(r.extra_values?.participation_points);
    if (Number.isFinite(pts) && pts > 0) return true;
    const note = r.extra_values?.professor_note;
    return typeof note === "string" && note.trim().length > 0;
  });
}
