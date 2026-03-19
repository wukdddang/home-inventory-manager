"use client";

import { useState } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { newEntityId } from "../../_lib/dashboard-helpers";
import type { Household, InventoryRow } from "@/types/domain";

type DashboardItemFormSectionProps = {
  selected: Household | null;
};

export function DashboardItemFormSection({
  selected,
}: DashboardItemFormSectionProps) {
  const { 거점을_갱신_한다 } = useDashboard();
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemUnit, setItemUnit] = useState("개");
  const [itemRoomId, setItemRoomId] = useState("");

  if (!selected) return null;

  const handleAddItem = () => {
    const roomId = itemRoomId || selected.rooms[0]?.id;
    if (!roomId) return;
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
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-base font-semibold text-white">물품 등록</h2>
      <p className="mt-1 text-sm text-zinc-500">
        InventoryItem 로컬 행을 추가합니다. API 연동 시 storageLocationId에
        매핑하면 됩니다.
      </p>
      {selected.rooms.length === 0 ? (
        <p className="mt-4 text-sm text-amber-200/80">
          방을 먼저 추가한 뒤 물품을 등록할 수 있습니다.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">보관 방</label>
            <select
              value={itemRoomId || selected.rooms[0]?.id}
              onChange={(e) => setItemRoomId(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
            >
              {selected.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="button"
              onClick={handleAddItem}
              className="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-white"
            >
              물품 추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
