/**
 * Notifications bell — Django `/api/notifications/` + optional local client pushes.
 *
 * Backend stores per-user rows (`title`, `message`, `link`, `type`, `read`).
 * Client-side `pushRoleNotification` still works for instant UI before the next poll.
 */

import { getApiBaseUrl } from "@/lib/apiBase";
import { checkinPath } from "@/lib/checkinApi";
import { loadDrfListAll } from "@/lib/drfPaginatedList";
import { getAccessToken, getCurrentAppRole, type StoredAppRole } from "@/lib/tokenStorage";

export type NotificationAudience = StoredAppRole;

/** Normalized shape for the bell UI. */
export type NotificationDto = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
  /** Backend notification type (e.g. `justification_accepted`). */
  type?: string;
  /** In-app route from backend (e.g. `/Justifications`). */
  link?: string;
  /** Local-only: restrict to roles when set. */
  audience?: NotificationAudience[];
  /** `server` = persisted in Django; `client` = browser-only. */
  source?: "server" | "client";
};

type ApiNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
};

const ROLE_NOTIF_STORAGE_KEY = "chekin:role-notifications";
const MAX_STORED = 80;

const clientPushedNotifications: NotificationDto[] = [];

function isClientNotificationId(id: string): boolean {
  return id.startsWith("client-") || id.startsWith("role-");
}

function serverNotificationsDisabled(): boolean {
  const v = process.env.NEXT_PUBLIC_SERVER_NOTIFICATIONS;
  return v === "false" || v === "0";
}

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return {
    Accept: "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

function normalizeNotificationLink(
  link: string | undefined,
  type?: string
): string | undefined {
  if (!link?.trim()) return undefined;
  const raw = link.trim();

  if (type === "exam_replacement") {
    return "/Scheduals/Replacement-Schedules";
  }

  const map: Record<string, string> = {
    "/justifications/": "/Justifications",
    "/justifications/my_justifications": "/Justifications/Student-Justifications",
    "/extra-sessions/": "/ProfAuditions/Requests",
    "/extra-sessions/my_requests": "/Sessions",
    "/teacher-absence/": "/ProfAuditions/Absences",
    "/teacher-absence/my_requests": "/ProfAuditions/Absences",
    "/exclusions": "/Absences",
    "/exclusions/": "/Absences",
    "/documents": "/Scheduals",
    "/documents/": "/Scheduals",
    "/attendance/sessions/": "/Dashboard",
  };
  if (map[raw]) return map[raw];
  if (raw.startsWith("/") && !raw.includes("://")) {
    return raw;
  }
  return undefined;
}

function mapApiNotification(n: ApiNotification): NotificationDto {
  return {
    id: String(n.id),
    title: n.title,
    body: n.message,
    created_at: n.created_at,
    read: n.read,
    type: n.type,
    link: normalizeNotificationLink(n.link, n.type),
    source: "server",
  };
}

function readStoredRoleNotifications(): NotificationDto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROLE_NOTIF_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as NotificationDto[]) : [];
  } catch {
    return [];
  }
}

function writeStoredRoleNotifications(list: NotificationDto[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    ROLE_NOTIF_STORAGE_KEY,
    JSON.stringify(list.slice(0, MAX_STORED))
  );
}

function mergeUniqueById(...lists: NotificationDto[][]): NotificationDto[] {
  const byId = new Map<string, NotificationDto>();
  for (const list of lists) {
    for (const n of list) {
      byId.set(n.id, { ...n });
    }
  }
  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function filterNotificationsForRole(
  list: NotificationDto[],
  role: NotificationAudience
): NotificationDto[] {
  return list.filter((n) => {
    if (n.source === "server") return true;
    if (!n.audience || n.audience.length === 0) return true;
    return n.audience.includes(role);
  });
}

function mergeClientNotifications(base: NotificationDto[]): NotificationDto[] {
  const role = getCurrentAppRole();
  if (!role) return base;
  const pushed = mergeUniqueById(
    clientPushedNotifications,
    readStoredRoleNotifications()
  ).map((n) => ({ ...n, source: "client" as const }));
  const ids = new Set(pushed.map((p) => p.id));
  const rest = base.filter((b) => !ids.has(b.id));
  return filterNotificationsForRole([...pushed, ...rest], role);
}

function dispatchRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("chekin-notifications-refresh"));
  }
}

/** Push a notification visible to every role (local only). */
export function pushClientNotification(
  partial: Pick<NotificationDto, "title" | "body">
): string {
  const id = `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  clientPushedNotifications.unshift({
    id,
    title: partial.title,
    body: partial.body,
    created_at: new Date().toISOString(),
    read: false,
    source: "client",
  });
  dispatchRefresh();
  return id;
}

/** Push a notification for selected roles only (local only). */
export function pushRoleNotification(partial: {
  title: string;
  body: string;
  audience: NotificationAudience[];
}): string {
  const id = `role-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const entry: NotificationDto = {
    id,
    title: partial.title,
    body: partial.body,
    created_at: new Date().toISOString(),
    read: false,
    audience: partial.audience,
    source: "client",
  };
  clientPushedNotifications.unshift(entry);
  const stored = readStoredRoleNotifications();
  stored.unshift(entry);
  writeStoredRoleNotifications(stored);
  dispatchRefresh();
  return id;
}

function markStoredNotificationRead(id: string): boolean {
  const stored = readStoredRoleNotifications();
  const item = stored.find((n) => n.id === id);
  if (!item) return false;
  item.read = true;
  writeStoredRoleNotifications(stored);
  return true;
}

async function fetchServerNotifications(): Promise<NotificationDto[]> {
  if (serverNotificationsDisabled() || !getAccessToken()) {
    return [];
  }

  const base = getApiBaseUrl();
  const headers = authHeaders();
  const rows = await loadDrfListAll<ApiNotification>(
    base,
    `${checkinPath.notifications.collection}/`,
    headers,
    { pageSize: 50, requireFirstOk: false }
  );
  return rows.map(mapApiNotification);
}

export async function fetchNotifications(): Promise<NotificationDto[]> {
  try {
    const server = await fetchServerNotifications();
    return mergeClientNotifications(server);
  } catch {
    return mergeClientNotifications([]);
  }
}

export async function fetchUnreadNotificationCount(): Promise<number | null> {
  if (serverNotificationsDisabled() || !getAccessToken()) return null;

  try {
    const base = getApiBaseUrl().replace(/\/+$/, "");
    const path = checkinPath.notifications.unreadCount.replace(/^\/+/, "");
    const res = await fetch(`${base}/${path}/`, { headers: authHeaders() });
    if (!res.ok) return null;
    const data = (await res.json()) as { unread_count?: number };
    return typeof data.unread_count === "number" ? data.unread_count : null;
  } catch {
    return null;
  }
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const inMem = clientPushedNotifications.find((x) => x.id === id);
  if (inMem) {
    inMem.read = true;
  }
  if (markStoredNotificationRead(id)) {
    return true;
  }
  if (inMem) {
    return true;
  }

  if (serverNotificationsDisabled() || !getAccessToken() || isClientNotificationId(id)) {
    return false;
  }

  try {
    const base = getApiBaseUrl().replace(/\/+$/, "");
    const path = checkinPath.notifications.markRead(id).replace(/^\/+/, "");
    const res = await fetch(`${base}/${path}/`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const role = getCurrentAppRole();
  if (!role) return false;

  clientPushedNotifications.forEach((n) => {
    if (!n.audience || n.audience.length === 0 || n.audience.includes(role)) {
      n.read = true;
    }
  });
  const stored = readStoredRoleNotifications();
  for (const n of stored) {
    if (!n.audience || n.audience.length === 0 || n.audience.includes(role)) {
      n.read = true;
    }
  }
  writeStoredRoleNotifications(stored);

  if (serverNotificationsDisabled() || !getAccessToken()) {
    return true;
  }

  try {
    const serverItems = await fetchServerNotifications();
    const unreadServer = serverItems.filter((n) => !n.read);
    const results = await Promise.all(
      unreadServer.map((n) => markNotificationRead(n.id))
    );
    return results.every(Boolean);
  } catch {
    return false;
  }
}

/** Admin broadcast — POST `/api/notifications/broadcast/` */
export async function adminBroadcastNotification(body: {
  roles: ("STUDENT" | "TEACHER" | "SCHOOLING" | "ADMIN")[];
  title: string;
  message: string;
  link?: string;
}): Promise<{ ok: boolean; detail?: string }> {
  const token = getAccessToken();
  if (!token) return { ok: false, detail: "Not authenticated" };

  try {
    const base = getApiBaseUrl().replace(/\/+$/, "");
    const path = checkinPath.notifications.broadcast.replace(/^\/+/, "");
    const res = await fetch(`${base}/${path}/`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { detail?: string };
    if (!res.ok) {
      return { ok: false, detail: data.detail ?? `HTTP ${res.status}` };
    }
    dispatchRefresh();
    return { ok: true, detail: data.detail };
  } catch {
    return { ok: false, detail: "Network error" };
  }
}
