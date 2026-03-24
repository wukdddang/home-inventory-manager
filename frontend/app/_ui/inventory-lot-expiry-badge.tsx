"use client";

import { cn } from "@/lib/utils";

export type InventoryLotExpiryBadgeProps = {
  worstExpiryDays: number | null;
  lotCount: number;
  /** 로트가 없을 때 표시 (기본 —) */
  emptyLabel?: string;
  className?: string;
};

/**
 * 물품 목록·표에서 구매 연동 로트의 가장 급한 유통기한을 뱃지로 표시한다.
 */
export function InventoryLotExpiryBadge({
  worstExpiryDays,
  lotCount,
  emptyLabel = "—",
  className,
}: InventoryLotExpiryBadgeProps) {
  if (lotCount === 0) {
    return (
      <span className={cn("text-xs text-zinc-300", className)}>
        {emptyLabel}
      </span>
    );
  }
  if (worstExpiryDays === null) {
    return (
      <span
        className={cn(
          "rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300",
          className,
        )}
      >
        로트 {lotCount}
      </span>
    );
  }
  if (worstExpiryDays < 0) {
    return (
      <span
        className={cn(
          "rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-200 ring-1 ring-rose-500/40",
          className,
        )}
      >
        만료 {Math.abs(worstExpiryDays)}일 · {lotCount}로트
      </span>
    );
  }
  if (worstExpiryDays === 0) {
    return (
      <span
        className={cn(
          "rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-100 ring-1 ring-amber-500/35",
          className,
        )}
      >
        오늘만료 · {lotCount}로트
      </span>
    );
  }
  if (worstExpiryDays <= 3) {
    return (
      <span
        className={cn(
          "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-100 ring-1 ring-amber-500/30",
          className,
        )}
      >
        D-{worstExpiryDays} · {lotCount}로트
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300",
        className,
      )}
    >
      D-{worstExpiryDays} · {lotCount}로트
    </span>
  );
}
