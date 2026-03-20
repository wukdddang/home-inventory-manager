"use client";

import { useMemo } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { HouseStructureFlow } from "../HouseStructureFlow.module";
import { ItemsSpreadsheet } from "../ItemsSpreadsheet.module";
import { RoomItemAddWidget } from "../DashboardItemForm.section";
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

  const handleRoomPositionChange = (
    roomId: string,
    x: number,
    y: number,
  ) => {
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      rooms: h.rooms.map((r) =>
        r.id === roomId ? { ...r, x, y } : r,
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
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 lg:min-h-[calc(100dvh-6.5rem)]">
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">조회 모드</h2>
          <p className="mt-1 text-sm text-zinc-500">
            구조도에서 방을 드래그해 배치하거나, 표로 전환해 물품을 확인합니다.
          </p>
        </div>
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </div>

      {viewMode === "structure" ? (
        <div className="mt-6 flex min-h-0 flex-1 flex-col gap-4">
          <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
              <HouseStructureFlow
                household={selected}
                selectedRoomId={selectedRoomId}
                onRoomSelect={(id) => onRoomSelect(id)}
                onRoomRename={handleRoomRename}
                onRoomPositionChange={handleRoomPositionChange}
              />
            </div>
            <RoomItemsPanel
              selectedRoomId={selectedRoomId}
              roomItems={roomItems}
            />
          </div>
          {selectedRoomId ? (
            <RoomItemAddWidget
              selected={selected}
              roomId={selectedRoomId}
            />
          ) : (
            <p className="shrink-0 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 px-4 py-3 text-center text-sm text-zinc-500">
              물품을 추가하려면 구조도에서 방을 먼저 선택하세요.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-6 flex min-h-0 flex-1 flex-col gap-4">
          <div className="min-h-0 flex-1 overflow-auto">
            <ItemsSpreadsheet
              household={selected}
              onDeleteItem={handleDeleteItem}
              onSelectRoomId={(id) => onRoomSelect(id)}
            />
          </div>
          {selectedRoomId ? (
            <RoomItemAddWidget
              selected={selected}
              roomId={selectedRoomId}
            />
          ) : (
            <p className="shrink-0 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 px-4 py-3 text-center text-sm text-zinc-500">
              표에서 행의 방을 참고한 뒤, 왼쪽 목록에서 방을 선택하면 여기서 물품을
              등록할 수 있습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
