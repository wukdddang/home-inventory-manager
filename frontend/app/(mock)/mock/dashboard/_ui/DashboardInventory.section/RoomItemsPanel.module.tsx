"use client";

import { useMemo } from "react";
import { groupInventoryByStorageForRoom } from "@/lib/household-location";
import type { Household, InventoryRow } from "@/types/domain";

type RoomItemsPanelProps = {
  household: Household;
  selectedRoomId: string | null;
  roomItems: InventoryRow[];
};

export function RoomItemsPanel({
  household,
  selectedRoomId,
  roomItems,
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
            에 연결된 보관 칸(블록)마다 묶어 표시합니다.
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
                    {g.items.map((it) => (
                      <li
                        key={it.id}
                        className="flex items-start justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 flex-1 text-zinc-200">
                          <span className="block truncate leading-snug">
                            {it.name}
                          </span>
                          {it.variantCaption ? (
                            <span className="mt-0.5 block truncate text-[10px] text-zinc-500">
                              {it.variantCaption}
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 tabular-nums text-zinc-400">
                          {it.quantity}
                          {it.unit}
                        </span>
                      </li>
                    ))}
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
