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

/** Reserved ID so we never hit the real API for this row */
export const MOCK_PROF_SESSION_ID = 9_000_001;

function todayIso(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Dev-only fake session for UI testing (no backend row). */
export function buildMockProfSession(): SessionApi {
  const date = todayIso();
  const attendances: AttendanceRow[] = [
    {
      id: 9_100_001,
      session: MOCK_PROF_SESSION_ID,
      student: 1,
      student_name: "Boukhari Imene Douaa",
      student_email: "HBF0004@student.univ.dz",
      status: "absent",
    },
    {
      id: 9_100_002,
      session: MOCK_PROF_SESSION_ID,
      student: 2,
      student_name: "Demo Student",
      student_email: "student.demo@univ.dz",
      status: "present",
    },
    {
      id: 9_100_003,
      session: MOCK_PROF_SESSION_ID,
      student: 3,
      student_name: "Test User",
      student_email: "test.user@univ.dz",
      status: "justified",
    },
  ];
  return {
    id: MOCK_PROF_SESSION_ID,
    assignment: 0,
    date,
    start_time: "09:00:00",
    end_time: "11:00:00",
    module_name: "Algebra",
    group_name: "G2",
    attendances,
  };
}

export function isMockProfSessionId(id: number): boolean {
  return id === MOCK_PROF_SESSION_ID;
}

/**
 * In `npm run dev`, show a fake “session today” unless disabled via
 * `NEXT_PUBLIC_DEV_MOCK_PROF_SESSION=false`.
 */
export function isProfSessionMockEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_DEV_MOCK_PROF_SESSION !== "false"
  );
}
