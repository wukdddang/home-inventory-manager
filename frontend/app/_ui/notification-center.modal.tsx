"use client";

import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import {
  getNotifications,
  getNotificationsServerSnapshot,
  setNotifications,
  subscribeNotifications,
} from "@/lib/local-store";
import { cn } from "@/lib/utils";
import type { NotificationItem, NotificationType } from "@/types/domain";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Clock,
  PackageMinus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useCallback, useId, useMemo, useSyncExternalStore } from "react";

function notificationIcon(type: NotificationType) {
  switch (type) {
    case "expiration_soon":
      return <Clock className="size-4 text-amber-400" />;
    case "expired":
      return <AlertTriangle className="size-4 text-red-400" />;
    case "low_stock":
      return <PackageMinus className="size-4 text-orange-400" />;
    case "shopping_reminder":
      return <ShoppingCart className="size-4 text-teal-400" />;
    case "shopping_list_update":
      return <ShoppingCart className="size-4 text-sky-400" />;
  }
}

function notificationTypeLabel(type: NotificationType) {
  switch (type) {
    case "expiration_soon":
      return "유통기한 임박";
    case "expired":
      return "유통기한 만료";
    case "low_stock":
      return "재고 부족";
    case "shopping_reminder":
      return "장보기 리마인더";
    case "shopping_list_update":
      return "장보기 목록 변경";
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

function NotificationRow({
  item,
  onMarkRead,
  onDelete,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isRead = item.readAt !== null;

  return (
    <li
      className={cn(
        "group relative flex gap-3 rounded-xl border px-3.5 py-3 transition-colors",
        isRead
          ? "border-zinc-800/60 bg-zinc-950/30"
          : "border-zinc-700/80 bg-zinc-900/60",
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80">
        {notificationIcon(item.type)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-snug",
              isRead
                ? "font-normal text-zinc-400"
                : "font-medium text-zinc-100",
            )}
          >
            {item.title}
          </p>
          {!isRead && (
            <span className="mt-1 size-2 shrink-0 rounded-full bg-teal-400" />
          )}
        </div>
        {item.body && (
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
            {item.body}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">
            {notificationTypeLabel(item.type)}
          </span>
          <span className="text-[11px] text-zinc-600">·</span>
          <span className="text-[11px] text-zinc-500">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!isRead && (
          <button
            type="button"
            onClick={() => onMarkRead(item.id)}
            className="cursor-pointer rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-teal-300"
            aria-label="읽음 처리"
            title="읽음 처리"
          >
            <CheckCheck className="size-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="cursor-pointer rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
          aria-label="삭제"
          title="삭제"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  );
}

export type NotificationCenterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string | null;
};

export function NotificationCenterModal({
  open,
  onOpenChange,
  householdId,
}: NotificationCenterModalProps) {
  const titleId = useId().replace(/:/g, "");
  const descId = useId().replace(/:/g, "");

  const allNotifications = useSyncExternalStore(
    subscribeNotifications,
    getNotifications,
    getNotificationsServerSnapshot,
  );

  const notifications = useMemo(
    () =>
      householdId
        ? allNotifications
            .filter((n) => n.householdId === householdId)
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
        : [],
    [allNotifications, householdId],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.readAt === null).length,
    [notifications],
  );

  const 읽음_처리_한다 = useCallback(
    (id: string) => {
      const all = getNotifications();
      setNotifications(
        all.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
    },
    [],
  );

  const 삭제_한다 = useCallback((id: string) => {
    setNotifications(getNotifications().filter((n) => n.id !== id));
  }, []);

  const 전체_읽음_처리_한다 = useCallback(() => {
    if (!householdId) return;
    const now = new Date().toISOString();
    const all = getNotifications();
    setNotifications(
      all.map((n) =>
        n.householdId === householdId && n.readAt === null
          ? { ...n, readAt: now }
          : n,
      ),
    );
  }, [householdId]);

  const 전체_삭제_한다 = useCallback(() => {
    if (!householdId) return;
    setNotifications(
      getNotifications().filter((n) => n.householdId !== householdId),
    );
  }, [householdId]);

  return (
    <MotionModalLayer
      open={open}
      onOpenChange={onOpenChange}
      closeOnOverlayClick
      panelClassName="fixed left-1/2 top-1/2 z-10041 flex w-[min(100vw-1.5rem,28rem)] max-w-[100vw] -translate-x-1/2 -translate-y-1/2 outline-none sm:w-[min(100vw-2rem,32rem)]"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descId}
    >
      <div className="flex max-h-[min(92dvh,44rem)] w-full flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-4 py-4 sm:px-5">
          <div className="min-w-0 pr-2">
            <h2
              id={titleId}
              className="flex items-center gap-2 text-lg font-semibold text-white"
            >
              <Bell className="size-5 text-teal-400" />
              알림
              {unreadCount > 0 && (
                <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-medium text-teal-300">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p id={descId} className="mt-1 text-sm text-zinc-400">
              {householdId
                ? "유통기한, 재고 부족, 장보기 관련 알림입니다."
                : "대시보드에서 거점을 선택하면 알림을 볼 수 있습니다."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 cursor-pointer rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            닫기
          </button>
        </div>

        {/* Actions bar */}
        {notifications.length > 0 && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-b border-zinc-800/60 px-4 py-2 sm:px-5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={전체_읽음_처리_한다}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium text-teal-400 transition-colors hover:bg-teal-500/10"
              >
                모두 읽음
              </button>
            )}
            <button
              type="button"
              onClick={전체_삭제_한다}
              className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400"
            >
              모두 삭제
            </button>
          </div>
        )}

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5 sm:py-5">
          {!householdId ? (
            <p className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-6 text-center text-sm text-zinc-400">
              메인(대시보드)에서 거점을 선택한 상태로 다시 열어 주세요.
            </p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-800/60">
                <Bell className="size-7 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-400">새 알림이 없습니다</p>
              <p className="max-w-60 text-center text-xs leading-relaxed text-zinc-500">
                유통기한 임박, 재고 부족, 장보기 리마인더 등 알림이 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  item={n}
                  onMarkRead={읽음_처리_한다}
                  onDelete={삭제_한다}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </MotionModalLayer>
  );
}

/** 헤더용 — 읽지 않은 알림 수를 반환 */
export function useUnreadNotificationCount(
  householdId: string | null,
): number {
  const all = useSyncExternalStore(
    subscribeNotifications,
    getNotifications,
    getNotificationsServerSnapshot,
  );
  return useMemo(
    () =>
      householdId
        ? all.filter(
            (n) => n.householdId === householdId && n.readAt === null,
          ).length
        : 0,
    [all, householdId],
  );
}
