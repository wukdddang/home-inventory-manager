"use client";

import { InventoryLotExpiryBadge } from "@/app/_ui/inventory-lot-expiry-badge";
import { groupInventoryByStorageForRoom } from "@/lib/household-location";
import { 구매목록에서_품목_로트_요약을_구한다 } from "@/lib/inventory-lot-from-purchases";
import type { Household, InventoryRow, PurchaseRecord } from "@/types/domain";
import { useMemo } from "react";

type RoomItemsPanelProps = {
  household: Household;
  selectedRoomId: string | null;
  roomItems: InventoryRow[];
  purchases: PurchaseRecord[];
  on소비하려고_연다: (item: InventoryRow) => void;
  on폐기하려고_연다: (item: InventoryRow) => void;
};

export function RoomItemsPanel({
  household,
  selectedRoomId,
  roomItems,
  purchases,
  on소비하려고_연다,
  on폐기하려고_연다,
}: RoomItemsPanelProps) {
  const roomName = useMemo(() => {
    if (!selectedRoomId) return null;
    return household.rooms.find((r) => r.id === selectedRoomId)?.name ?? "방";
  }, [household.rooms, selectedRoomId]);

  const groups = useMemo(() => {
    if (!selectedRoomId) return [];
    return groupInventoryByStorageForRoom(
      household,
      selectedRoomId,
      roomItems,
    );
  }, [household, selectedRoomId, roomItems]);

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-950/80">
      <div className="shrink-0 border-b border-zinc-800/80 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">선택한 방의 물품</h3>
        {selectedRoomId && roomName ? (
          <p className="mt-1 text-xs text-zinc-500">
            <span className="font-medium text-teal-200/90">{roomName}</span>
            에 연결된 보관 칸(블록)마다 묶어 표시합니다. 구매와 연결된 품목은
            로트·임박이 보입니다.
          </p>
        ) : (
          <p className="mt-1 text-xs text-zinc-500">
            구조도에서 방을 클릭하면 아래에 방·보관 위치·품목이 한눈에 정리됩니다.
          </p>
        )}
      </div>

      {!selectedRoomId ? (
        <p className="px-4 py-6 text-sm text-zinc-500">구조도에서 방을 클릭하세요.</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {roomItems.length === 0 ? (
            <p className="px-1 py-2 text-sm text-zinc-500">
              등록된 물품이 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => (
                <section
                  key={g.storageLocationId ?? "__unassigned__"}
                  className="rounded-xl border border-zinc-800/90 bg-zinc-900/50"
                >
                  <div className="border-b border-zinc-800/80 px-3 py-2">
                    <h4 className="text-xs font-semibold text-teal-200/95">
                      {g.heading}
                    </h4>
                    <p className="mt-0.5 text-[10px] text-zinc-600">
                      품목 {g.items.length}개
                    </p>
                  </div>
                  <ul className="divide-y divide-zinc-800/60">
                    {g.items.map((it) => {
                      const lot = 구매목록에서_품목_로트_요약을_구한다(
                        purchases,
                        household.id,
                        it.id,
                      );
                      return (
                        <li
                          key={it.id}
                          className="flex flex-col gap-2 px-3 py-2.5 text-sm sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block truncate leading-snug text-zinc-200">
                              {it.name}
                            </span>
                            {it.variantCaption ? (
                              <span className="mt-0.5 block truncate text-[10px] text-zinc-500">
                                {it.variantCaption}
                              </span>
                            ) : null}
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <InventoryLotExpiryBadge
                                worstExpiryDays={lot.worstExpiryDays}
                                lotCount={lot.lotCount}
                              />
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
                            <span className="tabular-nums text-zinc-400 sm:text-right">
                              {it.quantity}
                              {it.unit}
                            </span>
                            <div className="flex flex-wrap justify-end gap-1">
                              <button
                                type="button"
                                disabled={it.quantity < 1}
                                onClick={() => on소비하려고_연다(it)}
                                className="cursor-pointer rounded-lg border border-zinc-600 px-2 py-0.5 text-[10px] text-teal-300/95 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                소비
                              </button>
                              <button
                                type="button"
                                disabled={it.quantity < 1}
                                onClick={() => on폐기하려고_연다(it)}
                                className="cursor-pointer rounded-lg border border-zinc-600 px-2 py-0.5 text-[10px] text-rose-300/90 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                폐기
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
