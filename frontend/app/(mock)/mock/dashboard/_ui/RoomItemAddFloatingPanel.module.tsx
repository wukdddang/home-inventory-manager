"use client";

import { RoomItemAddWidget } from "./DashboardItemForm.section";
import { cn } from "@/lib/utils";
import type { Household } from "@/types/domain";

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

  return (
    <div
      id={anchorId}
      className={cn(
        "scroll-mt-4 flex min-w-0 flex-col overflow-hidden rounded-xl border border-teal-500/25 bg-zinc-950/90 shadow-inner shadow-black/20 ring-1 ring-teal-500/10",
      )}
      aria-label={`${room?.name ?? "방"}에 물품 추가`}
    >
      {expanded ? (
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="flex shrink-0 items-start justify-between gap-2 border-b border-zinc-800/90 px-3 py-2.5">
            <div className="min-w-0 pt-0.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-teal-500/90">
                물품 추가
              </p>
              <p className="truncate text-sm font-semibold text-zinc-100">
                {room?.name ?? "방"}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <button
                type="button"
                onClick={() => onExpandedChange(false)}
                className="cursor-pointer rounded-lg border border-zinc-600 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800"
              >
                접기
              </button>
              <button
                type="button"
                onClick={onDismissRoom}
                className="cursor-pointer text-[11px] text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
              >
                방 선택 해제
              </button>
            </div>
          </div>
          <div className="max-h-[min(52vh,28rem)] min-h-0 overflow-y-auto overscroll-y-contain px-3 pb-4 pt-3">
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
