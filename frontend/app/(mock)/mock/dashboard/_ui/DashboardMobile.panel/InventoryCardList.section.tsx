"use client";

import { InventoryLotExpiryBadge } from "@/app/_ui/inventory-lot-expiry-badge";
import { 유통기한까지_일수를_구한다 } from "@/lib/purchase-lot-helpers";
import { getPurchases } from "@/lib/local-store";
import type { Household, InventoryRow, StructureRoom } from "@/types/domain";
import { ChevronDown, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type InventoryCardListProps = {
  household: Household;
  onItemTap: (item: InventoryRow) => void;
};

type StorageGroup = {
  label: string;
  items: InventoryRow[];
};

type RoomSection = {
  room: StructureRoom;
  storageGroups: StorageGroup[];
  itemCount: number;
};

function useRoomSections(
  household: Household,
  search: string,
): RoomSection[] {
  return useMemo(() => {
    let items = household.items;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.variantCaption?.toLowerCase().includes(q) ?? false),
      );
    }

    const sections: RoomSection[] = [];

    for (const room of household.rooms) {
      const roomItems = items.filter((item) => item.roomId === room.id);
      if (roomItems.length === 0 && search.trim()) continue;

      const storageMap = new Map<string, InventoryRow[]>();
      for (const item of roomItems) {
        const storage = household.storageLocations?.find(
          (s) => s.id === item.storageLocationId,
        );
        const key = storage?.name ?? "";
        const group = storageMap.get(key);
        if (group) group.push(item);
        else storageMap.set(key, [item]);
      }

      sections.push({
        room,
        storageGroups: Array.from(storageMap, ([label, items]) => ({
          label,
          items,
        })),
        itemCount: roomItems.length,
      });
    }

    // 미지정 방 아이템
    const unassigned = items.filter(
      (item) => !household.rooms.some((r) => r.id === item.roomId),
    );
    if (unassigned.length > 0) {
      sections.push({
        room: { id: "__unassigned__", name: "미지정" } as StructureRoom,
        storageGroups: [{ label: "", items: unassigned }],
        itemCount: unassigned.length,
      });
    }

    return sections;
  }, [household, search]);
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
  onItemTap,
}: InventoryCardListProps) {
  const [search, setSearch] = useState("");
  const sections = useRoomSections(household, search);
  const expiryMap = useItemExpiryInfo(household);

  // 모든 방을 기본 열림 상태로 초기화
  const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set());

  const toggleRoom = useCallback((roomId: string) => {
    setCollapsedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  }, []);

  const totalItems = sections.reduce((sum, s) => sum + s.itemCount, 0);

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

      {/* 방별 토글 섹션 */}
      {totalItems === 0 && sections.every((s) => s.itemCount === 0) ? (
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
        <div className="flex flex-col gap-2">
          {sections.map(({ room, storageGroups, itemCount }) => {
            const isCollapsed = collapsedRooms.has(room.id);
            return (
              <div
                key={room.id}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50"
              >
                {/* 방 토글 헤더 */}
                <button
                  type="button"
                  onClick={() => toggleRoom(room.id)}
                  className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 transition-colors active:bg-zinc-800/50"
                >
                  <span className="text-sm font-semibold text-zinc-100">
                    {room.name}
                  </span>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium tabular-nums text-zinc-400">
                    {itemCount}
                  </span>
                  <ChevronDown
                    className={`ml-auto size-4 text-zinc-500 transition-transform duration-200 ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </button>

                {/* 아이템 목록 */}
                {!isCollapsed && (
                  <div className="flex flex-col gap-2 px-3 pb-3">
                    {itemCount === 0 ? (
                      <p className="py-2 text-center text-xs text-zinc-600">
                        재고 없음
                      </p>
                    ) : (
                      storageGroups.map((group) => (
                        <div key={group.label} className="flex flex-col gap-1.5">
                          {group.label && (
                            <p className="mt-1 px-1 text-[11px] font-medium text-zinc-500">
                              {group.label}
                            </p>
                          )}
                          <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                          {group.items.map((item) => {
                            const expiry = expiryMap.get(item.id);
                            const worstDays = expiry?.worstDays ?? null;
                            const lotCount = expiry?.lotCount ?? 0;
                            const isExpired =
                              worstDays !== null && worstDays < 0;
                            const isExpiring =
                              worstDays !== null &&
                              worstDays >= 0 &&
                              worstDays <= 7;
                            const isLowStock =
                              item.minStockLevel != null &&
                              item.quantity <= item.minStockLevel;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onItemTap(item)}
                                className={`w-full cursor-pointer rounded-lg border bg-zinc-900 px-3 py-2.5 text-left transition-colors active:bg-zinc-800 ${
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
                              </button>
                            );
                          })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
