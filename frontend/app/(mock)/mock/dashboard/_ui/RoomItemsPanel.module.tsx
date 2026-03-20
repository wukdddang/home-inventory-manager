"use client";

import { formatLocationBreadcrumb } from "@/lib/household-location";
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
  return (
    <aside className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h3 className="text-sm font-semibold text-white">선택한 방의 물품</h3>
      {!selectedRoomId ? (
        <p className="mt-3 text-sm text-zinc-500">구조도에서 방을 클릭하세요.</p>
      ) : (
        <ul className="mt-3 max-h-[240px] space-y-2 overflow-y-auto text-sm">
          {roomItems.length === 0 ? (
            <li className="text-zinc-500">등록된 물품이 없습니다.</li>
          ) : (
            roomItems.map((it) => (
              <li
                key={it.id}
                className="flex justify-between gap-2 rounded-lg bg-zinc-900 px-2 py-1.5 text-zinc-300"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{it.name}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-zinc-500">
                    {formatLocationBreadcrumb(household, it)}
                  </span>
                </span>
                <span className="shrink-0 self-start text-zinc-500">
                  {it.quantity}
                  {it.unit}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </aside>
  );
}
