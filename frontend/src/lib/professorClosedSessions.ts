/** Persist professor-marked "saved / finished" session ids (browser-only; backend has no completed flag). */
const STORAGE_KEY = "1cs_prof_closed_session_ids_v1";

function parseStoredIds(raw: string | null): Set<number> {
  if (!raw?.trim()) return new Set();
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    const nums = arr.filter(
      (x): x is number =>
        typeof x === "number" && Number.isFinite(x) && Number.isInteger(x)
    );
    return new Set(nums);
  } catch {
    return new Set();
  }
}

export function readClosedProfessorSessionIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    return parseStoredIds(localStorage.getItem(STORAGE_KEY));
  } catch {
    return new Set();
  }
}

export function markProfessorSessionClosedLocally(sessionId: number): void {
  if (typeof window === "undefined") return;
  try {
    const next = readClosedProfessorSessionIds();
    next.add(sessionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    /* quota / private mode */
  }
}
