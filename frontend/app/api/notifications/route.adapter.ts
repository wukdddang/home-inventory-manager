import type { NotificationItem, NotificationType } from "@/types/domain";
import { getNotifications, setNotifications } from "@/lib/local-store";

// ── Response DTO ──────────────────────────────────────────────────────────────

export interface ApiNotification {
  id: string;
  userId: string;
  householdId: string | null;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

export function mapApiToNotificationItem(n: ApiNotification): NotificationItem {
  return {
    id: n.id,
    householdId: n.householdId ?? "",
    type: n.type as NotificationType,
    title: n.title,
    body: n.body ?? undefined,
    readAt: n.isRead ? n.createdAt : null,
    createdAt: n.createdAt,
  };
}

// ── Client helpers ────────────────────────────────────────────────────────────

/**
 * API에서 거점의 알림 목록을 불러와 localStorage와 동기화한다.
 * 다른 거점 알림은 유지된다.
 */
export async function loadNotificationsFromApi(
  householdId: string,
): Promise<void> {
  const res = await fetch(`/api/notifications?householdId=${householdId}`);
  const json = (await res.json()) as {
    success: boolean;
    data: ApiNotification[];
  };
  if (!json.success) return;
  const apiItems = json.data.map(mapApiToNotificationItem);
  const local = getNotifications();
  const otherHouseholds = local.filter((n) => n.householdId !== householdId);
  setNotifications([...otherHouseholds, ...apiItems]);
}

/** 알림을 읽음 처리한다. */
export async function markNotificationReadApi(id: string): Promise<void> {
  await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
}
