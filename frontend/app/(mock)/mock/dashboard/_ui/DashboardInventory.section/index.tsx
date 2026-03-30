"use client";

import { toast } from "@/hooks/use-toast";
import { resolveItemRoomId } from "@/lib/household-location";
import {
  getInventoryLedger,
  getPurchases,
  subscribeInventoryLedger,
  subscribePurchases,
} from "@/lib/local-store";
import {
  getMockPurchasesSession,
  subscribeMockPurchasesSession,
} from "../../../purchases/_context/purchases-mock.service";
import { cn } from "@/lib/utils";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import type { Household, InventoryRow } from "@/types/domain";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import {
  HouseStructureFlow,
  type StructureDiagramCommitPayload,
} from "./HouseStructureFlow.module";
import {
  InventoryConsumeWasteModal,
  type InventoryConsumeWasteMode,
} from "./InventoryConsumeWaste.module";
import { ItemDetailDrawer } from "./ItemDetailDrawer.module";
import { ItemsSpreadsheet } from "./ItemsSpreadsheet.module";
import { RoomItemsPanel } from "./RoomItemsPanel.module";
import { RoomItemAddPanel } from "./RoomItemAddFloatingPanel.module";
import { ViewModeToggle, type ViewMode } from "./ViewModeToggle.module";

export type { ViewMode } from "./ViewModeToggle.module";

function ViewModeEyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("size-4 shrink-0 text-teal-400/90", className)}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

type DashboardInventorySectionProps = {
  selected: Household | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string | null) => void;
  itemAddPanelAnchorId?: string;
};

export function DashboardInventorySection({
  selected,
  viewMode,
  onViewModeChange,
  selectedRoomId,
  onRoomSelect,
  itemAddPanelAnchorId,
}: DashboardInventorySectionProps) {
  const prefix = useAppRoutePrefix();
  const {
    dataMode,
    거점을_갱신_한다,
    거점_카탈로그를_가져온다,
    재고_소비를_기록_한다,
    재고_폐기를_기록_한다,
  } = useDashboard();
  const productCatalog = selected
    ? 거점_카탈로그를_가져온다(selected.id)
    : { units: [], categories: [], products: [], variants: [] };

  const purchases = useSyncExternalStore(
    dataMode === "mock" ? subscribeMockPurchasesSession : subscribePurchases,
    () => (dataMode === "mock" ? getMockPurchasesSession() : getPurchases()),
    () => [],
  );

  const inventoryLedger = useSyncExternalStore(
    subscribeInventoryLedger,
    getInventoryLedger,
    () => [],
  );

  const [cwOpen, setCwOpen] = useState(false);
  const [cwItem, setCwItem] = useState<InventoryRow | null>(null);
  const [cwMode, setCwMode] = useState<InventoryConsumeWasteMode>("consume");

  const [drawerItem, setDrawerItem] = useState<InventoryRow | null>(null);
  const drawerOpen = drawerItem !== null;

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

  const handleStructureDiagramCommit = (
    payload: StructureDiagramCommitPayload,
  ) => {
    거점을_갱신_한다(selected.id, (h) => {
      const nextLayout = { ...(h.structureDiagramLayout ?? {}) };
      for (const [k, pos] of Object.entries(payload.layoutPatch)) {
        nextLayout[k] = pos;
      }
      let next: typeof h = {
        ...h,
        structureDiagramLayout: nextLayout,
      };
      if (payload.room) {
        next = {
          ...next,
          rooms: next.rooms.map((r) =>
            r.id === payload.room!.roomId
              ? { ...r, x: payload.room!.x, y: payload.room!.y }
              : r,
          ),
        };
      }
      return next;
    });
  };

  const handleDeleteItem = (itemId: string) => {
    const item = selected.items.find((i) => i.id === itemId);
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      items: h.items.filter((i) => i.id !== itemId),
    }));
    toast({
      title: "재고를 삭제했습니다",
      description: item?.name,
      variant: "destructive",
    });
  };

  const handleOpenConsume = (it: InventoryRow) => {
    setCwItem(it);
    setCwMode("consume");
    setCwOpen(true);
  };

  const handleOpenWaste = (it: InventoryRow) => {
    setCwItem(it);
    setCwMode("waste");
    setCwOpen(true);
  };

  const handleCwConfirm = (
    quantity: number,
    memo: string,
    wasteReason?: string,
  ) => {
    if (!selected || !cwItem) return;
    if (cwMode === "consume") {
      const ok = 재고_소비를_기록_한다(selected.id, cwItem.id, quantity, memo);
      if (ok) {
        toast({
          title: "소비를 기록했습니다",
          description: `${cwItem.name} −${quantity}${cwItem.unit}`,
        });
      } else {
        toast({
          title: "기록할 수 없습니다",
          description: "보유 수량을 확인하세요.",
          variant: "warning",
        });
      }
      return;
    }
    const ok = 재고_폐기를_기록_한다(
      selected.id,
      cwItem.id,
      quantity,
      wasteReason ?? "other",
      memo,
    );
    if (ok) {
      toast({
        title: "폐기를 기록했습니다",
        description: `${cwItem.name} −${quantity}${cwItem.unit}`,
      });
    } else {
      toast({
        title: "기록할 수 없습니다",
        description: "보유 수량을 확인하세요.",
        variant: "warning",
      });
    }
  };

  const noRoomHint = (
    <p className="shrink-0 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 px-4 py-3 text-center text-sm text-zinc-300">
      {viewMode === "structure" ? (
        <>
          재고를 추가하려면 구조도에서 방을 선택하세요. 보관 장소는 왼쪽「가구
          배치·보관 장소」에서 정한 뒤, 아래「재고 추가」에서 재고를 넣습니다.
        </>
      ) : (
        <>
          표에서 방을 참고한 뒤 왼쪽에서 방을 선택하면, 이 섹션 아래「재고
          추가」에서 등록할 수 있습니다.
        </>
      )}
    </p>
  );

  return (
    <div className="flex min-h-0 w-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-white">
            <ViewModeEyeIcon />
            조회 모드
          </h2>
          <p className="mt-1 text-sm text-zinc-300">
            구조도에서 방·직속·가구 블록을 드래그해 배치하거나, 표로 전환해
            재고를 확인합니다. 구매와 연결된 품목은 로트·임박이 표시됩니다.
          </p>
          <Link
            href={`${prefix}/inventory-history`}
            className="mt-2 inline-block text-xs font-medium text-teal-400/90 hover:underline"
          >
            재고 이력 타임라인 보기 →
          </Link>
        </div>
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </div>

      {viewMode === "structure" ? (
        <div className="mt-6 flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 items-stretch gap-4 lg:min-h-95 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,22rem)]">
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 lg:min-h-70">
              <HouseStructureFlow
                household={selected}
                selectedRoomId={selectedRoomId}
                onRoomSelect={(id) => onRoomSelect(id)}
                onRoomRename={handleRoomRename}
                onStructureDiagramCommit={handleStructureDiagramCommit}
              />
            </div>
            <div className="flex min-h-0 flex-col lg:min-h-60">
              <RoomItemsPanel
                household={selected}
                selectedRoomId={selectedRoomId}
                roomItems={roomItems}
                purchases={purchases}
                catalog={productCatalog}
                on소비하려고_연다={handleOpenConsume}
                on폐기하려고_연다={handleOpenWaste}
                onItemClick={setDrawerItem}
              />
            </div>
          </div>
          {!selectedRoomId ? noRoomHint : null}
        </div>
      ) : (
        <div className="mt-6 flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <div className="min-h-0 flex-1 overflow-auto">
            <ItemsSpreadsheet
              household={selected}
              catalog={productCatalog}
              purchases={purchases}
              onDeleteItem={handleDeleteItem}
              on소비하려고_연다={handleOpenConsume}
              on폐기하려고_연다={handleOpenWaste}
              onItemClick={setDrawerItem}
              onUpdateItemMinStock={(itemId, min) => {
                거점을_갱신_한다(selected.id, (h) => ({
                  ...h,
                  items: h.items.map((row) =>
                    row.id === itemId
                      ? { ...row, minStockLevel: min }
                      : row,
                  ),
                }));
                const item = selected.items.find((r) => r.id === itemId);
                toast({
                  title: "최소 재고가 저장되었습니다",
                  description: item
                    ? `${item.name}: ${min == null ? "기준 없음" : `${min}${item.unit}`}`
                    : undefined,
                  variant: "success",
                });
              }}
              onSelectRoomId={(id) => onRoomSelect(id)}
            />
          </div>
          {!selectedRoomId ? noRoomHint : null}
        </div>
      )}

      {selectedRoomId ? (
        <div className="mt-6 shrink-0 border-t border-zinc-800">
          <RoomItemAddPanel
            key={selectedRoomId}
            selected={selected}
            roomId={selectedRoomId}
            anchorId={itemAddPanelAnchorId}
          />
        </div>
      ) : null}

      <InventoryConsumeWasteModal
        key={`${cwItem?.id ?? "none"}-${cwMode}`}
        open={cwOpen}
        onOpenChange={setCwOpen}
        mode={cwMode}
        item={cwItem}
        maxQuantity={cwItem?.quantity ?? 0}
        on확인한다={handleCwConfirm}
      />

      <ItemDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerItem(null)}
        item={drawerItem}
        household={selected}
        catalog={productCatalog}
        purchases={purchases}
        ledger={inventoryLedger}
        on소비하려고_연다={handleOpenConsume}
        on폐기하려고_연다={handleOpenWaste}
      />
    </div>
  );
}
