/** Fired after a professor saves & closes an attendance session sheet. */
export const PROF_SESSION_SAVED_EVENT = "chekin-prof-session-saved";

export type ProfSessionSavedDetail = {
  sessionId: number;
  assignmentId?: number;
};

export function dispatchProfSessionSaved(
  sessionId: number,
  assignmentId?: number
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ProfSessionSavedDetail>(PROF_SESSION_SAVED_EVENT, {
      detail: { sessionId, assignmentId },
    })
  );
}
