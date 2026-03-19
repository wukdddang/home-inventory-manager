"use client";

import { useState } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { KIND_LABEL } from "../../_lib/dashboard-helpers";
import type { HouseholdKind } from "@/types/domain";

type DashboardHouseholdsSectionProps = {
  selectedHouseholdId: string | null;
  onSelectHousehold: (id: string) => void;
  onAfterAddHousehold: (id: string) => void;
  onDeleteHousehold: (id: string) => void;
};

export function DashboardHouseholdsSection({
  selectedHouseholdId,
  onSelectHousehold,
  onAfterAddHousehold,
  onDeleteHousehold,
}: DashboardHouseholdsSectionProps) {
  const { households, 거점을_추가_한다 } = useDashboard();
  const [newHouseName, setNewHouseName] = useState("");
  const [newHouseKind, setNewHouseKind] = useState<HouseholdKind>("home");

  const handleAddHousehold = () => {
    const id = 거점을_추가_한다(newHouseName, newHouseKind);
    onAfterAddHousehold(id);
    setNewHouseName("");
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h1 className="text-lg font-semibold text-white">내 거점</h1>
      <p className="mt-1 text-sm text-zinc-500">
        집·사무실·차량 등 Household을 여러 개 등록할 수 있습니다. 등록 후 방
        (StorageLocation)과 물품(InventoryItem)을 관리하세요.
      </p>

      {households.length === 0 ? (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
          등록된 거점이 없습니다. 아래에서 첫 거점을 만들어 보세요.
        </p>
      ) : (
        <p className="mt-4 rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 text-sm text-teal-100/90">
          거점이 있어도 언제든지 새 거점을 추가할 수 있습니다.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-medium text-zinc-400">
            거점 이름 (예: 집1, 사무실1, 차1)
          </label>
          <input
            value={newHouseName}
            onChange={(e) => setNewHouseName(e.target.value)}
            placeholder="우리 집"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
          />
        </div>
        <div className="w-full max-w-[200px] space-y-2">
          <label className="text-xs font-medium text-zinc-400">유형</label>
          <select
            value={newHouseKind}
            onChange={(e) =>
              setNewHouseKind(e.target.value as HouseholdKind)
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
          >
            {(Object.keys(KIND_LABEL) as HouseholdKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleAddHousehold}
          className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
        >
          거점 추가
        </button>
      </div>

      {households.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {households.map((h) => (
            <div
              key={h.id}
              className={`flex items-center gap-1 rounded-xl border px-2 py-1 pl-3 ${
                h.id === selectedHouseholdId
                  ? "border-teal-500/60 bg-teal-500/10"
                  : "border-zinc-700 bg-zinc-950/80"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectHousehold(h.id)}
                className="text-left text-sm font-medium text-white"
              >
                {h.name}
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  {KIND_LABEL[h.kind]}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteHousehold(h.id)}
                className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-rose-500/20 hover:text-rose-300"
                aria-label={`${h.name} 삭제`}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
