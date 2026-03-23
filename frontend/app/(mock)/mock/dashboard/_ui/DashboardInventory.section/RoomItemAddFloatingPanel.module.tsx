"use client";

import { cn } from "@/lib/utils";
import { PackagePlus } from "lucide-react";
import type { Household } from "@/types/domain";
import {
  ItemAddPanelHeaderCatalogHint,
  RoomItemAddWidget,
} from "../DashboardItemForm.section";
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
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 pr-1">
            <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold leading-none text-teal-400">
              <PackagePlus className="size-4 shrink-0 text-teal-400/95" aria-hidden />
              물품 추가
            </span>
            <span
              className="max-w-[min(100%,10rem)] shrink-0 truncate text-sm font-semibold leading-none text-zinc-100 sm:max-w-56"
              title={room?.name ?? "방"}
            >
              {room?.name ?? "방"}
            </span>
          </div>
          <div className="ml-auto min-w-0 max-w-[min(100%,22rem)] shrink sm:max-w-md">
            <ItemAddPanelHeaderCatalogHint className="block text-right text-[11px] leading-snug sm:text-left" />
          </div>
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
