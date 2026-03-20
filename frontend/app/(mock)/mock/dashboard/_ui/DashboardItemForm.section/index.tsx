"use client";

import { useState } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { newEntityId } from "../../_lib/dashboard-helpers";
import { toast } from "@/hooks/use-toast";
import type { Household, InventoryRow } from "@/types/domain";

export type RoomItemAddWidgetProps = {
  selected: Household;
  roomId: string;
};

/** 방 선택 후에만 표시 — 선택한 방에 물품 추가 */
export function RoomItemAddWidget({
  selected,
  roomId,
}: RoomItemAddWidgetProps) {
  const { 거점을_갱신_한다 } = useDashboard();
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemUnit, setItemUnit] = useState("개");

  const room = selected.rooms.find((r) => r.id === roomId);

  const handleAddItem = () => {
    if (!room) return;
    const qty = Math.max(0, Number(itemQty) || 0);
    const row: InventoryRow = {
      id: newEntityId(),
      name: itemName.trim() || "이름 없는 품목",
      quantity: qty,
      unit: itemUnit.trim() || "개",
      roomId,
    };
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      items: [...h.items, row],
    }));
    setItemName("");
    setItemQty("1");
    toast({
      title: "물품 추가됨",
      description: `${row.name} → ${room.name}`,
      variant: "success",
    });
  };

  if (!room) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
        선택한 방을 찾을 수 없습니다. 목록을 확인해 주세요.
      </p>
    );
  }

  return (
    <div className="shrink-0 rounded-2xl border border-teal-500/25 bg-teal-500/5 p-4 ring-1 ring-teal-500/10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-teal-200">
            물품 등록 — {room.name}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            선택한 방에만 추가됩니다.
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs text-zinc-400">품목명</label>
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
            placeholder="라면 5개입"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-400">수량</label>
          <input
            type="number"
            min={0}
            value={itemQty}
            onChange={(e) => setItemQty(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-400">단위</label>
          <input
            value={itemUnit}
            onChange={(e) => setItemUnit(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAddItem}
            className="w-full rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
          >
            물품 추가
          </button>
        </div>
      </div>
    </div>
  );
}
