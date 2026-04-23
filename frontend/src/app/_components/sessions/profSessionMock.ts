import type { AttendanceRow, SessionApi } from "@/lib/professorSessionData";

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
      extra_values: { participation_points: 0, professor_note: "" },
    },
    {
      id: 9_100_002,
      session: MOCK_PROF_SESSION_ID,
      student: 2,
      student_name: "Demo Student",
      student_email: "student.demo@univ.dz",
      status: "present",
      extra_values: { participation_points: 2, professor_note: "" },
    },
    {
      id: 9_100_003,
      session: MOCK_PROF_SESSION_ID,
      student: 3,
      student_name: "Test User",
      student_email: "test.user@univ.dz",
      status: "justified",
      extra_values: { participation_points: 0, professor_note: "" },
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

/** Reserved ID; never exists on the server — for schedule-form UI when there are no real assignments. */
export const DEMO_TEACHER_ASSIGNMENT_ID = 9_000_002;

type DemoAssignmentRow = {
  id: number;
  group_name: string;
  module_name: string;
  year_name?: string;
  semester?: string;
};

/**
 * In `npm run dev`, when `GET` teaching-assignments yields nothing, inject a fake
 * group/module pair so the schedule dialog can be exercised. Turn off with
 * `NEXT_PUBLIC_DEV_DEMO_TEACHER_ASSIGNMENTS=false`.
 */
export function buildDemoTeacherAssignments(): DemoAssignmentRow[] {
  return [
    {
      id: DEMO_TEACHER_ASSIGNMENT_ID,
      group_name: "G4",
      year_name: "1CS",
      semester: "S2",
      module_name: "Gestion des Projets",
    },
  ];
}

export function isDemoTeacherAssignmentsEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_DEV_DEMO_TEACHER_ASSIGNMENTS !== "false"
  );
}

export function isDemoTeacherAssignmentId(id: number): boolean {
  return id === DEMO_TEACHER_ASSIGNMENT_ID;
}

const DEMO_SCHEDULE_SESSION_ID_START = 9_200_000;
let demoScheduleSessionSeq = 0;

export function nextDemoScheduleSessionId(): number {
  demoScheduleSessionSeq += 1;
  return DEMO_SCHEDULE_SESSION_ID_START + demoScheduleSessionSeq;
}

/**
 * Injected into local session state when the user “creates” a session in dev demo
 * mode (no `POST` to the server).
 */
export function buildDemoScheduleSessionRow(p: {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  group_name: string;
  module_name: string;
}): SessionApi {
  return {
    id: p.id,
    assignment: DEMO_TEACHER_ASSIGNMENT_ID,
    date: p.date,
    start_time: p.start_time,
    end_time: p.end_time,
    group_name: p.group_name,
    module_name: p.module_name,
    attendances: [],
  };
}

export function isDemoScheduleSessionId(id: number): boolean {
  return id >= DEMO_SCHEDULE_SESSION_ID_START && id < DEMO_SCHEDULE_SESSION_ID_START + 100_000;
}
