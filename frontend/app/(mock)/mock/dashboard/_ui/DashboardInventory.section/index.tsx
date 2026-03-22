"use client";

import { useMemo } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { HouseStructureFlow } from "./HouseStructureFlow.module";
import { ItemsSpreadsheet } from "./ItemsSpreadsheet.module";
import { RoomItemsPanel } from "./RoomItemsPanel.module";
import { ViewModeToggle, type ViewMode } from "./ViewModeToggle.module";
import { resolveItemRoomId } from "@/lib/household-location";
import type { Household } from "@/types/domain";
import { RoomItemAddPanel } from "./RoomItemAddFloatingPanel.module";

export type { ViewMode } from "./ViewModeToggle.module";

type DashboardInventorySectionProps = {
  selected: Household | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string | null) => void;
  itemAddPanelExpanded: boolean;
  onItemAddPanelExpandedChange: (expanded: boolean) => void;
  itemAddPanelAnchorId?: string;
};

export function DashboardInventorySection({
  selected,
  viewMode,
  onViewModeChange,
  selectedRoomId,
  onRoomSelect,
  itemAddPanelExpanded,
  onItemAddPanelExpandedChange,
  itemAddPanelAnchorId,
}: DashboardInventorySectionProps) {
  const { 거점을_갱신_한다, productCatalog } = useDashboard();

  const roomItems = useMemo(() => {
    if (!selected || !selectedRoomId) return [];
    return selected.items.filter(
      (i) => resolveItemRoomId(selected, i) === selectedRoomId,
    );
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

  const noRoomHint = (
    <p className="shrink-0 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 px-4 py-3 text-center text-sm text-zinc-500">
      {viewMode === "structure" ? (
        <>
          물품을 추가하려면 구조도에서 방을 선택하세요. 보관 칸은 왼쪽「가구
          배치·보관 장소」에서 정한 뒤, 아래「물품 추가」에서 재고를 넣습니다.
        </>
      ) : (
        <>
          표에서 방을 참고한 뒤 왼쪽에서 방을 선택하면, 이 섹션 아래「물품
          추가」에서 등록할 수 있습니다.
        </>
      )}
    </p>
  );

  return (
    <div className="flex min-h-0 w-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
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
        <div className="mt-6 flex min-h-0 min-w-0 flex-1 flex-col gap-4">
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
              household={selected}
              selectedRoomId={selectedRoomId}
              roomItems={roomItems}
            />
          </div>
          {!selectedRoomId ? noRoomHint : null}
        </div>
      ) : (
        <div className="mt-6 flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <div className="min-h-0 flex-1 overflow-auto">
            <ItemsSpreadsheet
              household={selected}
              catalog={productCatalog}
              onDeleteItem={handleDeleteItem}
              onSelectRoomId={(id) => onRoomSelect(id)}
            />
          </div>
          {!selectedRoomId ? noRoomHint : null}
        </div>
      )}

      {selectedRoomId ? (
        <div className="mt-6 shrink-0 border-t border-zinc-800 pt-4">
          <RoomItemAddPanel
            key={selectedRoomId}
            selected={selected}
            roomId={selectedRoomId}
            onDismissRoom={() => onRoomSelect(null)}
            expanded={itemAddPanelExpanded}
            onExpandedChange={onItemAddPanelExpandedChange}
            anchorId={itemAddPanelAnchorId}
          />
        </div>
      ) : null}
    </div>
  );
}
