"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { RoomItemAddWidget } from "./DashboardItemForm.section";
import { cn } from "@/lib/utils";
import type { Household } from "@/types/domain";

export type RoomItemAddFloatingPanelProps = {
  selected: Household;
  roomId: string;
  /** 방 선택 해제 (패널 숨김) */
  onDismissRoom: () => void;
};

/**
 * 조회 모드 레이아웃과 독립 — 뷰포트 오른쪽에 고정, 헤더 아래 전체 높이.
 * 접기 시 탭만 남고, 펼치면 내부 스크롤로 폼 확인.
 */
export function RoomItemAddFloatingPanel({
  selected,
  roomId,
  onDismissRoom,
}: RoomItemAddFloatingPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const room = selected.rooms.find((r) => r.id === roomId);

  return (
    <aside
      className={cn(
        "pointer-events-auto fixed right-0 top-14 z-35 flex h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden border-l border-teal-500/25 bg-zinc-950/95 shadow-[-12px_0_40px_-12px_rgba(0,0,0,0.65)] backdrop-blur-md supports-backdrop-filter:bg-zinc-950/85",
        "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[width]",
        expanded ? "w-[min(22rem,calc(100vw-12px))]" : "w-11",
      )}
      aria-label="이 방에 물품 추가"
    >
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex min-h-0 min-w-0 flex-1 flex-col"
          >
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
                  onClick={() => setExpanded(false)}
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
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pb-4 pt-3">
              <RoomItemAddWidget
                embedInFloatingPanel
                selected={selected}
                roomId={roomId}
              />
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={() => setExpanded(true)}
            className="flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-900/50 px-1 py-4 text-zinc-300 hover:bg-zinc-800/80"
            title="물품 추가 패널 펼치기"
          >
            <span
              className="text-[11px] font-semibold tracking-wide text-teal-400/95"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              물품 추가
            </span>
            <span className="text-lg text-teal-500/80" aria-hidden>
              ‹
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </aside>
  );
}
