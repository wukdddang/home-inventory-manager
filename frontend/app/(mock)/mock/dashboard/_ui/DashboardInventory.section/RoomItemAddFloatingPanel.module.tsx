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
  /** 방 선택 해제 (패널 숨김) */
  onDismissRoom: () => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** 왼쪽에서「물품 추가 패널 열기」등으로 스크롤 타깃 */
  anchorId?: string;
};

/**
 * 조회 모드 카드 하단에 붙는 물품 추가 패널.
 * `expanded`는 상위에서 관리해 가구·보관 섹션과 흐름을 맞출 수 있다.
 */
export function RoomItemAddPanel({
  selected,
  roomId,
  onDismissRoom,
  expanded,
  onExpandedChange,
  anchorId = "dashboard-item-add-panel",
}: RoomItemAddPanelProps) {
  const room = selected.rooms.find((r) => r.id === roomId);
  const {
    productCatalog,
    카탈로그를_갱신_한다,
    catalogHydrated,
  } = useDashboard();

  return (
    <div
      id={anchorId}
      className={cn(
        "scroll-mt-4 flex min-w-0 flex-col rounded-xl bg-zinc-950/90",
      )}
      aria-label={`${room?.name ?? "방"}에 물품 추가`}
    >
      {expanded ? (
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 shrink-0 flex-nowrap items-center gap-2 overflow-x-auto border-b border-zinc-800/90 px-2 py-2.5 sm:gap-3 sm:px-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1 pr-1">
              <span className="shrink-0 text-sm font-semibold text-teal-400">
                물품 추가
              </span>
              <span
                className="max-w-[min(100%,10rem)] shrink-0 truncate text-sm font-semibold text-zinc-100 sm:max-w-[14rem]"
                title={room?.name ?? "방"}
              >
                {room?.name ?? "방"}
              </span>
              <ItemAddPanelHeaderCatalogHint />
            </div>
            <div className="ml-auto flex min-w-0 shrink-0 flex-nowrap items-center gap-2 sm:gap-2.5">
              {catalogHydrated ? (
                <div
                  className="shrink-0"
                  aria-label="카탈로그 빠른 추가"
                >
                  <CatalogModalsControls
                    catalog={productCatalog}
                    onCatalogUpdate={카탈로그를_갱신_한다}
                    layout="panel"
                    buttonRowClassName="flex-nowrap items-center gap-2"
                  />
                </div>
              ) : null}
              <div className="flex shrink-0 items-center gap-2 border-l border-zinc-800/70 pl-2 sm:gap-2.5 sm:pl-3">
                <button
                  type="button"
                  onClick={() => onExpandedChange(false)}
                  className="cursor-pointer rounded-lg border border-zinc-600 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-zinc-300 hover:bg-zinc-800 sm:px-2.5"
                >
                  접기
                </button>
                <button
                  type="button"
                  onClick={onDismissRoom}
                  className="cursor-pointer text-[11px] whitespace-nowrap text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                >
                  방 선택 해제
                </button>
              </div>
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
      ) : (
        <button
          type="button"
          onClick={() => onExpandedChange(true)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-teal-500/[0.06]"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-teal-500/90">
              물품 추가
            </p>
            <p className="truncate text-sm font-semibold text-zinc-100">
              {room?.name ?? "방"} — 접혀 있음
            </p>
          </div>
          <span className="shrink-0 rounded-lg border border-teal-500/35 bg-teal-500/10 px-2.5 py-1 text-xs font-medium text-teal-300">
            펼치기
          </span>
        </button>
      )}
    </div>
  );
}
