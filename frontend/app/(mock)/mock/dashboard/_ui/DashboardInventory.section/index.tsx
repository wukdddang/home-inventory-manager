"use client";

import { useMemo } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { HouseStructure } from "../HouseStructure.module";
import { ItemsSpreadsheet } from "../ItemsSpreadsheet.module";
import { RoomItemsPanel } from "../RoomItemsPanel.module";
import {
  ViewModeToggle,
  type ViewMode,
} from "../ViewModeToggle.module";
import type { Household } from "@/types/domain";

type DashboardInventorySectionProps = {
  selected: Household | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string | null) => void;
};

export function DashboardInventorySection({
  selected,
  viewMode,
  onViewModeChange,
  selectedRoomId,
  onRoomSelect,
}: DashboardInventorySectionProps) {
  const { 거점을_갱신_한다 } = useDashboard();

  const roomItems = useMemo(() => {
    if (!selected || !selectedRoomId) return [];
    return selected.items.filter((i) => i.roomId === selectedRoomId);
  }, [selected, selectedRoomId]);

  if (!selected) return null;

  const handleRoomRename = (roomId: string, nextName: string) => {
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      rooms: h.rooms.map((x) =>
        x.id === roomId ? { ...x, name: nextName } : x,
      ),
    }));
  };

  const handleDeleteItem = (itemId: string) => {
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      items: h.items.filter((i) => i.id !== itemId),
    }));
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">조회 모드</h2>
          <p className="mt-1 text-sm text-zinc-500">
            집 구조(2D) 또는 물품 표 형태로 전환합니다.
          </p>
        </div>
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </div>

      {viewMode === "structure" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
            <HouseStructure
              household={selected}
              selectedRoomId={selectedRoomId}
              onRoomSelect={(id) => onRoomSelect(id)}
              onRoomRename={handleRoomRename}
            />
          </div>
          <RoomItemsPanel
            selectedRoomId={selectedRoomId}
            roomItems={roomItems}
          />
        </div>
      ) : (
        <div className="mt-6">
          <ItemsSpreadsheet
            household={selected}
            onDeleteItem={handleDeleteItem}
          />
        </div>
      )}
    </div>
  );
}
