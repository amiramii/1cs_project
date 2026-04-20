/** True when the browser could not complete the request (backend down, CORS, wrong URL). */
export function isNetworkFailure(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  if (e instanceof Error) {
    return /failed to fetch|networkerror|load failed|aborted/i.test(e.message);
  }
  return false;
}

export function apiUnreachableMessage(apiBase: string, isArabic: boolean): string {
  return isArabic
    ? `لا يمكن الاتصال بالخادم (${apiBase}). شغّل خادم Django أو تحقق من NEXT_PUBLIC_API_URL.`
    : `Cannot reach the API (${apiBase}). Start the backend or check NEXT_PUBLIC_API_URL.`;
}
