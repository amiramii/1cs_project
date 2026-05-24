/**
 * Fetches all pages of a Django REST Framework paginated list (page_size=…).
 * Uses raw `fetch` + Bearer token (same pattern as session data loading).
 */

import { buildApiAbsoluteUrl, getApiBaseUrl } from "./apiBase"

const DEFAULT_PAGE_SIZE = 50;

export function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && "results" in raw) {
    const r = (raw as { results?: T[] }).results;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

export function drfPaginationNext(raw: unknown): string | null {
  if (raw && typeof raw === "object" && "next" in raw) {
    const n = (raw as { next?: unknown }).next;
    if (typeof n === "string" && n.trim()) return n;
  }
  return null;
}

export function resolveAgainstApiBase(
  apiBase: string,
  pathOrUrl: string
): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = apiBase.replace(/\/+$/, "");
  const joined = pathOrUrl.startsWith("/")
    ? `${base}${pathOrUrl}`
    : `${base}/${pathOrUrl}`
  if (base.endsWith("/api") && /\/api\/api(\/|$)/.test(joined.replace(/^https?:\/\/[^/]+/i, ""))) {
    return joined.replace(/\/api\/api\//g, "/api/")
  }
  return joined
}

export async function loadDrfListAll<T>(
  apiBase: string,
  /** e.g. `api/academic/groups/` (relative to origin, with or without leading slash) */
  relativePath: string,
  headers: HeadersInit,
  options?: {
    requireFirstOk?: boolean;
    errorMessage?: string;
    pageSize?: number;
  }
): Promise<T[]> {
  const requireFirst = options?.requireFirstOk === true;
  const errMsg = options?.errorMessage ?? "List request failed";
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const path = relativePath.replace(/^\//, "");
  const [pathPart, queryStr] = path.includes("?") ? path.split("?", 2) : [path, ""];
  const params = new URLSearchParams(queryStr);
  params.set("page_size", String(pageSize));
  const origin = getApiBaseUrl();
  const useSharedBuilder = origin.replace(/\/+$/, "") === apiBase.replace(/\/+$/, "");
  let url: string | null = useSharedBuilder
    ? buildApiAbsoluteUrl(pathPart.replace(/\/+$/, ""), params)
    : (() => {
        const base = apiBase.replace(/\/+$/, "");
        const sep = path.includes("?") ? "&" : "?";
        return `${base}/${path}${sep}page_size=${pageSize}`;
      })();
  const merged: T[] = [];
  let guard = 0;
  while (url && guard < 50) {
    guard += 1;
    const r = await fetch(url, { headers });
    if (!r.ok) {
      if (requireFirst && merged.length === 0) {
        throw new Error(errMsg);
      }
      break;
    }
    const t = await r.text();
    let p: unknown = null;
    try {
      p = t ? JSON.parse(t) : null;
    } catch {
      if (requireFirst && merged.length === 0) throw new Error(errMsg);
      break;
    }
    merged.push(...unwrapList<T>(p));
    const next = drfPaginationNext(p);
    if (!next) break;
    url = resolveAgainstApiBase(apiBase, next);
  }
  return merged;
}
