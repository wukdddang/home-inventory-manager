"use client";

import { BottomSheet } from "@/app/_ui/mobile/BottomSheet.component";
import { InventoryLotExpiryBadge } from "@/app/_ui/inventory-lot-expiry-badge";
import { 유통기한까지_일수를_구한다 } from "@/lib/purchase-lot-helpers";
import { getPurchases, getInventoryLedger } from "@/lib/local-store";
import type {
  Household,
  InventoryRow,
  InventoryLedgerRow,
} from "@/types/domain";
import {
  PackagePlus,
  UtensilsCrossed,
  Trash2,
  MapPin,
  Package,
  Clock,
} from "lucide-react";
import { useMemo } from "react";

type ItemActionSheetProps = {
  item: InventoryRow | null;
  household: Household;
  onClose: () => void;
  onUse: (item: InventoryRow) => void;
  onWaste: (item: InventoryRow) => void;
  onRestock: (item: InventoryRow) => void;
};

const LEDGER_TYPE_LABEL: Record<string, string> = {
  in: "입고",
  out: "소비",
  adjust: "조정",
  waste: "폐기",
};

function formatRelativeDate(iso: string): string {
  const diff = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  return `${diff}일 전`;
}

export function ItemActionSheet({
  item,
  household,
  onClose,
  onUse,
  onWaste,
  onRestock,
}: ItemActionSheetProps) {
  // 수납위치 경로
  const locationLabel = useMemo(() => {
    if (!item) return null;
    const room = household.rooms.find((r) => r.id === item.roomId);
    const storage = household.storageLocations?.find(
      (s) => s.id === item.storageLocationId,
    );
    return [room?.name, storage?.name].filter(Boolean).join(" > ") || null;
  }, [item, household]);

  // 로트/배치 정보
  const lotInfo = useMemo(() => {
    if (!item) return { lotCount: 0, worstDays: null as number | null };
    const purchases = getPurchases().filter(
      (p) =>
        p.householdId === household.id && p.inventoryItemId === item.id,
    );
    let worstDays: number | null = null;
    let lotCount = 0;
    for (const p of purchases) {
      for (const batch of p.batches) {
        lotCount++;
        const days = 유통기한까지_일수를_구한다(batch.expiresOn);
        if (days !== null && (worstDays === null || days < worstDays)) {
          worstDays = days;
        }
      }
    }
    return { lotCount, worstDays };
  }, [item, household.id]);

  // 최근 이력 (최대 3건)
  const recentHistory = useMemo<InventoryLedgerRow[]>(() => {
    if (!item) return [];
    return getInventoryLedger()
      .filter(
        (r) =>
          r.householdId === household.id && r.inventoryItemId === item.id,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 3);
  }, [item, household.id]);

  if (!item)
    return (
      <BottomSheet open={false} onClose={onClose}>
        {null}
      </BottomSheet>
    );

  const isLowStock =
    item.minStockLevel != null && item.quantity <= item.minStockLevel;

  const handleAction = (action: (item: InventoryRow) => void) => {
    onClose();
    setTimeout(() => action(item), 200);
  };

  return (
    <BottomSheet open={item !== null} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* 아이템 기본 정보 */}
        <div className="flex flex-col gap-1.5 px-1">
          <p className="text-base font-semibold text-zinc-100">
            {item.name}
            {item.variantCaption && (
              <span className="ml-1.5 font-normal text-zinc-500">
                {item.variantCaption}
              </span>
            )}
          </p>
          <p className="text-sm text-zinc-400">
            현재 {item.quantity}
            {item.unit} 보유
            {isLowStock && (
              <span className="ml-1.5 text-blue-400">
                (적정 {item.minStockLevel}
                {item.unit})
              </span>
            )}
          </p>
        </div>

        {/* 상세 정보 */}
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
          {/* 수납위치 */}
          {locationLabel && (
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0 text-zinc-500" />
              <span className="text-xs text-zinc-300">{locationLabel}</span>
            </div>
          )}
          {/* 로트/배치 */}
          <div className="flex items-center gap-2">
            <Package className="size-3.5 shrink-0 text-zinc-500" />
            <span className="text-xs text-zinc-300">
              {lotInfo.lotCount > 0
                ? `로트 ${lotInfo.lotCount}건`
                : "로트 없음"}
            </span>
            {lotInfo.lotCount > 0 && (
              <InventoryLotExpiryBadge
                worstExpiryDays={lotInfo.worstDays}
                lotCount={lotInfo.lotCount}
              />
            )}
          </div>
          {/* 최근 이력 */}
          {recentHistory.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 shrink-0 text-zinc-500" />
                <span className="text-xs text-zinc-500">최근 이력</span>
              </div>
              {recentHistory.map((row) => (
                <div
                  key={row.id}
                  className="ml-5.5 flex items-center gap-2 text-xs"
                >
                  <span className="shrink-0 text-zinc-500">
                    {formatRelativeDate(row.createdAt)}
                  </span>
                  <span className="text-zinc-400">
                    {LEDGER_TYPE_LABEL[row.type] ?? row.type}{" "}
                    {row.quantityDelta > 0 ? "+" : ""}
                    {row.quantityDelta}
                    {item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleAction(onRestock)}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition-colors active:bg-zinc-800"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/15">
              <PackagePlus className="size-5 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-zinc-100">보충</p>
              <p className="text-xs text-zinc-500">재고를 추가합니다</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onUse)}
            disabled={item.quantity <= 0}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition-colors active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-teal-500/15">
              <UtensilsCrossed className="size-5 text-teal-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-zinc-100">사용</p>
              <p className="text-xs text-zinc-500">소비한 수량을 차감합니다</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onWaste)}
            disabled={item.quantity <= 0}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition-colors active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/15">
              <Trash2 className="size-5 text-rose-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-zinc-100">폐기</p>
              <p className="text-xs text-zinc-500">
                만료·손상된 재고를 처리합니다
              </p>
            </div>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
