"use client";

import { SwipeableCard } from "@/app/_ui/mobile/SwipeableCard.component";
import { InventoryLotExpiryBadge } from "@/app/_ui/inventory-lot-expiry-badge";
import { 유통기한까지_일수를_구한다 } from "@/lib/purchase-lot-helpers";
import { getPurchases } from "@/lib/local-store";
import type { Household, InventoryRow } from "@/types/domain";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

type InventoryCardListProps = {
  household: Household;
  onUse: (item: InventoryRow) => void;
  onWaste: (item: InventoryRow) => void;
};

type GroupedItems = {
  label: string;
  items: InventoryRow[];
};

function useGroupedItems(
  household: Household,
  search: string,
  roomFilter: string | null,
): GroupedItems[] {
  return useMemo(() => {
    let items = household.items;

    // 검색 필터
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.variantCaption?.toLowerCase().includes(q) ?? false),
      );
    }

    // 방 필터
    if (roomFilter) {
      items = items.filter((item) => item.roomId === roomFilter);
    }

    // 방 > 수납위치로 그룹핑
    const groups = new Map<string, InventoryRow[]>();
    for (const item of items) {
      const room = household.rooms.find((r) => r.id === item.roomId);
      const storage = household.storageLocations?.find(
        (s) => s.id === item.storageLocationId,
      );
      const key = [room?.name ?? "미지정", storage?.name]
        .filter(Boolean)
        .join(" > ");
      const group = groups.get(key);
      if (group) {
        group.push(item);
      } else {
        groups.set(key, [item]);
      }
    }

    return Array.from(groups, ([label, items]) => ({ label, items }));
  }, [household, search, roomFilter]);
}

function useItemExpiryInfo(household: Household) {
  return useMemo(() => {
    const purchases = getPurchases().filter(
      (p) => p.householdId === household.id,
    );
    const map = new Map<
      string,
      { worstDays: number | null; lotCount: number }
    >();

    for (const item of household.items) {
      const linked = purchases.filter((p) => p.inventoryItemId === item.id);
      let worstDays: number | null = null;
      let lotCount = 0;
      for (const p of linked) {
        for (const batch of p.batches) {
          lotCount++;
          const days = 유통기한까지_일수를_구한다(batch.expiresOn);
          if (days !== null && (worstDays === null || days < worstDays)) {
            worstDays = days;
          }
        }
      }
      map.set(item.id, { worstDays, lotCount });
    }
    return map;
  }, [household]);
}

export function InventoryCardList({
  household,
  onUse,
  onWaste,
}: InventoryCardListProps) {
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  const groups = useGroupedItems(household, search, roomFilter);
  const expiryMap = useItemExpiryInfo(household);

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* 검색 바 */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="재고 검색..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pr-3 pl-9 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-teal-500/50"
          style={{ fontSize: "16px" }}
        />
      </div>

      {/* 방 필터 칩 */}
      {household.rooms.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setRoomFilter(null)}
            className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              roomFilter === null
                ? "bg-teal-500/15 text-teal-300"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            전체
          </button>
          {household.rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() =>
                setRoomFilter(roomFilter === room.id ? null : room.id)
              }
              className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                roomFilter === room.id
                  ? "bg-teal-500/15 text-teal-300"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>
      )}

      {/* 재고 목록 */}
      {totalItems === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12">
          <p className="text-sm text-zinc-500">
            {search ? "검색 결과가 없습니다." : "등록된 재고가 없습니다."}
          </p>
          {!search && (
            <p className="text-xs text-zinc-600">
              데스크탑에서 재고를 등록해 주세요.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <h3 className="px-1 text-xs font-medium tracking-wide text-zinc-500">
                {group.label}
              </h3>
              <div className="flex flex-col gap-2">
                {group.items.map((item) => {
                  const expiry = expiryMap.get(item.id);
                  const worstDays = expiry?.worstDays ?? null;
                  const lotCount = expiry?.lotCount ?? 0;
                  const isExpired = worstDays !== null && worstDays < 0;
                  const isExpiring =
                    worstDays !== null && worstDays >= 0 && worstDays <= 7;
                  const isLowStock =
                    item.minStockLevel != null &&
                    item.quantity <= item.minStockLevel;

                  return (
                    <SwipeableCard
                      key={item.id}
                      actions={[
                        {
                          label: "사용",
                          color: "bg-teal-600",
                          onClick: () => onUse(item),
                        },
                        {
                          label: "폐기",
                          color: "bg-rose-600",
                          onClick: () => onWaste(item),
                        },
                      ]}
                    >
                      <div
                        className={`rounded-xl border bg-zinc-900 px-4 py-3 ${
                          isExpired
                            ? "border-l-4 border-zinc-800 border-l-rose-500"
                            : isExpiring
                              ? "border-l-4 border-zinc-800 border-l-amber-500"
                              : isLowStock
                                ? "border-l-4 border-zinc-800 border-l-blue-500"
                                : "border-zinc-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-zinc-100">
                              {item.name}
                              {item.variantCaption && (
                                <span className="ml-1.5 text-zinc-500">
                                  {item.variantCaption}
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-400">
                              {item.quantity}
                              {item.unit} 보유
                              {isLowStock && (
                                <span className="ml-1.5 text-blue-400">
                                  (부족)
                                </span>
                              )}
                            </p>
                          </div>
                          <InventoryLotExpiryBadge
                            worstExpiryDays={worstDays}
                            lotCount={lotCount}
                          />
                        </div>
                      </div>
                    </SwipeableCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
