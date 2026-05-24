/**
 * Notifications API client for the bell / header UI.
 *
 * Django `Checkin_backend` does not ship `/api/notifications/` unless you add it.
 * Set `NEXT_PUBLIC_SERVER_NOTIFICATIONS=true` when the backend route exists; otherwise
 * only in-browser client-pushed notifications (e.g. after student actions) appear.
 */

import { getApiBaseUrl } from "@/lib/apiBase";
import { getAccessToken } from "@/lib/tokenStorage";

export type NotificationDto = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
};

function apiBase(): string {
  return getApiBaseUrl();
}

function serverNotificationsEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_SERVER_NOTIFICATIONS;
  return v === "true" || v === "1";
}

const clientPushedNotifications: NotificationDto[] = [];

function mergeClientNotifications(base: NotificationDto[]): NotificationDto[] {
  const pushed = clientPushedNotifications.map((n) => ({ ...n }));
  const ids = new Set(pushed.map((p) => p.id));
  const rest = base.filter((b) => !ids.has(b.id));
  return [...pushed, ...rest];
}

/** Push a notification visible in the header bell; fires `chekin-notifications-refresh`. */
export function pushClientNotification(partial: Pick<NotificationDto, "title" | "body">): string {
  const id = `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  clientPushedNotifications.unshift({
    id,
    title: partial.title,
    body: partial.body,
    created_at: new Date().toISOString(),
    read: false,
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("chekin-notifications-refresh"));
  }
  return id;
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function debugFetchDelayMs(): number {
  if (typeof process === "undefined") return 0;
  const raw = process.env.NEXT_PUBLIC_NOTIFICATIONS_DEBUG_DELAY_MS;
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function fetchNotifications(): Promise<NotificationDto[]> {
  const debugDelay = debugFetchDelayMs();
  if (debugDelay > 0) {
    await delay(debugDelay);
  }

  if (!serverNotificationsEnabled()) {
    return mergeClientNotifications([]);
  }

  const token = getAccessToken();
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    const res = await fetch(`${apiBase()}/api/notifications/`, { headers });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as NotificationDto[] | { results?: NotificationDto[] };
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data.results)
        ? data.results
        : [];
    return mergeClientNotifications(list);
  } catch {
    return mergeClientNotifications([]);
  }
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const client = clientPushedNotifications.find((x) => x.id === id);
  if (client) {
    client.read = true;
    return true;
  }

  if (!serverNotificationsEnabled()) {
    return false;
  }

  const token = getAccessToken();
  try {
    const res = await fetch(`${apiBase()}/api/notifications/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ read: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function markAllNotificationsRead(): Promise<boolean> {
  clientPushedNotifications.forEach((n) => {
    n.read = true;
  });

  if (!serverNotificationsEnabled()) {
    return true;
  }

  const token = getAccessToken();
  try {
    const res = await fetch(`${apiBase()}/api/notifications/mark-all-read/`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}
