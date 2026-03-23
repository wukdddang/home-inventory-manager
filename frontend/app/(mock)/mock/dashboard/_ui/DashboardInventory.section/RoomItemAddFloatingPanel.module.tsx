"use client";

import { CatalogModalsControls } from "@/app/(current)/dashboard/_ui/CatalogModals.controls";
import { cn } from "@/lib/utils";
import type { Household } from "@/types/domain";
import {
  ItemAddPanelHeaderCatalogHint,
  RoomItemAddWidget,
} from "../DashboardItemForm.section";
import { useDashboard } from "../../_hooks/useDashboard";

export type RoomItemAddPanelProps = {
  selected: Household;
  roomId: string;
  /** 왼쪽에서「물품 추가 패널」등으로 스크롤 타깃 */
  anchorId?: string;
};

/**
 * 조회 모드 카드 하단에 붙는 물품 추가 패널 (항상 펼침).
 */
export function RoomItemAddPanel({
  selected,
  roomId,
  anchorId = "dashboard-item-add-panel",
}: RoomItemAddPanelProps) {
  const room = selected.rooms.find((r) => r.id === roomId);
  const { productCatalog, 카탈로그를_갱신_한다, catalogHydrated } =
    useDashboard();

  return (
    <div
      id={anchorId}
      className={cn(
        "scroll-mt-4 flex min-w-0 flex-col overflow-hidden rounded-xl bg-zinc-950/90",
      )}
      aria-label={`${room?.name ?? "방"}에 물품 추가`}
    >
      <div className="flex min-w-0 flex-col">
        <div className="flex min-w-0 shrink-0 flex-nowrap items-center gap-2 overflow-x-auto border-b border-zinc-800/90 px-2 py-2.5 sm:gap-3 sm:px-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1 pr-1">
            <span className="shrink-0 text-sm font-semibold text-teal-400">
              물품 추가
            </span>
            <span
              className="max-w-[min(100%,10rem)] shrink-0 truncate text-sm font-semibold text-zinc-100 sm:max-w-56"
              title={room?.name ?? "방"}
            >
              {room?.name ?? "방"}
            </span>
            <ItemAddPanelHeaderCatalogHint />
          </div>
          {catalogHydrated ? (
            <div className="ml-auto flex min-w-0 shrink-0 flex-nowrap items-center gap-2 sm:gap-2.5">
              <div className="shrink-0" aria-label="카탈로그 빠른 추가">
                <CatalogModalsControls
                  catalog={productCatalog}
                  onCatalogUpdate={카탈로그를_갱신_한다}
                  layout="panel"
                  buttonRowClassName="flex-nowrap items-center gap-2"
                />
              </div>
            </div>
          ) : null}
        </div>
        <div className="px-3 py-3">
          <RoomItemAddWidget
            embedInFloatingPanel
            selected={selected}
            roomId={roomId}
          />
        </div>
      </div>
    </div>
  );
}
