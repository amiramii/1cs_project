/** Persist professor "saved / finished" sessions (browser-only; backend has no completed flag). */

const STORAGE_KEY = "1cs_prof_closed_sessions_v2";

type ClosedSessionEntry = {
  id: number;
  date: string;
};

function readAllEntries(): ClosedSessionEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw?.trim()) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is ClosedSessionEntry =>
        row != null &&
        typeof row === "object" &&
        typeof (row as ClosedSessionEntry).id === "number" &&
        Number.isFinite((row as ClosedSessionEntry).id) &&
        typeof (row as ClosedSessionEntry).date === "string"
    );
  } catch {
    return [];
  }
}

function writeEntries(entries: ClosedSessionEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota / private mode */
  }
}

/** Sessions the professor closed on a given calendar day (ISO date). */
export function readClosedProfessorSessionIdsForDate(dateIso: string): Set<number> {
  const want = dateIso.trim();
  if (!want) return new Set();
  const ids = readAllEntries()
    .filter((e) => e.date === want)
    .map((e) => e.id);
  return new Set(ids);
}

export function markProfessorSessionClosedLocally(
  sessionId: number,
  dateIso: string
): void {
  const date = dateIso.trim();
  if (!date || !Number.isFinite(sessionId)) return;
  const entries = readAllEntries().filter(
    (e) => !(e.id === sessionId && e.date === date)
  );
  entries.push({ id: sessionId, date });
  writeEntries(entries);
}

export function unmarkProfessorSessionClosedLocally(
  sessionId: number,
  dateIso: string
): void {
  const date = dateIso.trim();
  const next = readAllEntries().filter(
    (e) => !(e.id === sessionId && e.date === date)
  );
  writeEntries(next);
}
