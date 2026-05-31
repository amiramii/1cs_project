import {
  normalizeGroupToken,
  type TimetableSlotRow,
} from "@/lib/excelTimetableClient";
import type { AssignmentApi, SessionApi } from "@/lib/professorSessionData";
import {
  normalizeApiTime,
  parseFrenchTimeSlot,
} from "@/lib/professorTimetableActions";

const FRENCH_WEEKDAYS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
] as const;

const TYPE_SORT_KEYS = ["cours", "td", "tp"] as const;

export function normalizeSessionTypeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Compares Excel `Session_Type` values (Cours, TD, TD/TP, …). */
export function sessionTypesEqual(a: string, b: string): boolean {
  const na = normalizeSessionTypeToken(a);
  const nb = normalizeSessionTypeToken(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const kind = (t: string) => {
    if (t.includes("tp") && t.includes("td")) return "tdtp";
    if (t.includes("tp")) return "tp";
    if (t.includes("td")) return "td";
    if (t.includes("cours") || t === "cm" || t.includes("course")) return "cours";
    return t;
  };
  return kind(na) === kind(nb);
}

export function frenchWeekdayFromIsoDate(iso: string): string {
  try {
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    return FRENCH_WEEKDAYS[d.getDay()] ?? "";
  } catch {
    return "";
  }
}

function normalizeModuleToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function moduleMatchesSlot(assignment: AssignmentApi, slot: TimetableSlotRow): boolean {
  const moduleWant = normalizeModuleToken(assignment.module_name ?? "");
  const subj = normalizeModuleToken(slot.subject);
  if (!moduleWant || !subj) return true;
  return subj.includes(moduleWant) || moduleWant.includes(subj);
}

function groupMatchesSlot(assignment: AssignmentApi, slot: TimetableSlotRow): boolean {
  const groupWant = normalizeGroupToken(assignment.group_name ?? "");
  if (!groupWant) return true;
  return normalizeGroupToken(slot.group) === groupWant;
}

export function slotsForAssignment(
  assignment: AssignmentApi,
  slots: TimetableSlotRow[]
): TimetableSlotRow[] {
  return slots.filter(
    (slot) => groupMatchesSlot(assignment, slot) && moduleMatchesSlot(assignment, slot)
  );
}

/** Distinct session types from uploaded Excel for this teaching assignment. */
export function sessionTypesForAssignment(
  assignment: AssignmentApi,
  slots: TimetableSlotRow[]
): string[] {
  const types = new Set<string>();
  for (const slot of slotsForAssignment(assignment, slots)) {
    const t = slot.session_type?.trim();
    if (t) types.add(t);
  }
  return sortSessionTypes([...types]);
}

export function sortSessionTypes(types: string[]): string[] {
  const rank = (raw: string) => {
    const t = normalizeSessionTypeToken(raw);
    const i = TYPE_SORT_KEYS.findIndex((k) => t.includes(k));
    return i >= 0 ? i : TYPE_SORT_KEYS.length;
  };
  return [...types].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });
}

/**
 * True when a saved API session matches this Excel session type (weekday + start time).
 */
export function sessionMatchesAssignmentSlotType(
  session: SessionApi,
  assignment: AssignmentApi,
  sessionType: string,
  slots: TimetableSlotRow[]
): boolean {
  if (!sessionType.trim()) return session.assignment === assignment.id;
  if (session.assignment !== assignment.id) return false;

  const weekday = frenchWeekdayFromIsoDate(session.date);
  const wantStart = normalizeApiTime(String(session.start_time));

  for (const slot of slotsForAssignment(assignment, slots)) {
    if (!sessionTypesEqual(slot.session_type, sessionType)) continue;
    if (slot.day?.trim() && weekday && slot.day.trim() !== weekday) continue;
    const times = parseFrenchTimeSlot(slot.time_slot);
    if (!times) continue;
    if (normalizeApiTime(times.start) === wantStart) return true;
  }
  return false;
}

export function filterSessionsBySlotType(
  sessions: SessionApi[],
  assignmentId: number,
  assignment: AssignmentApi | null,
  sessionType: string | null | undefined,
  slots: TimetableSlotRow[]
): SessionApi[] {
  const type = sessionType?.trim();
  if (!type || !assignment) return sessions;
  return sessions.filter(
    (s) =>
      s.assignment === assignmentId &&
      sessionMatchesAssignmentSlotType(s, assignment, type, slots)
  );
}
