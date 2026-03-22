"use client";

import { cn } from "@/lib/utils";
import { useIsPresent } from "framer-motion";

/**
 * 대시보드 mock `list()` 지연(~200ms)과 맞춰, 로컬 동기 로드만 하는 페이지에서도
 * `AppLoadingState`의 progress 막대가 한 박자 보이게 할 최소 시간(ms).
 */
export const APP_PAGE_MIN_LOADING_MS = 220;

export type AppLoadingBarProps = {
  className?: string;
  /** 트랙(배경 막대)에만 적용 */
  trackClassName?: string;
};

/**
 * 불확정 진행률(indeterminate) 가로 막대.
 * AnimatePresence exit 시 부모가 opacity/y를 줄 때와 자식 CSS transform 애니메이션이
 * 겹치면 끊겨 보일 수 있어, 퇴장 중에는 슬라이드 애니메이션을 끈다.
 *
 * `usePresence`는 register 후 `safeToRemove`가 필요해 `mode="wait"`에서 멈출 수 있음.
 * 여기서는 상태만 보면 되므로 `useIsPresent`만 쓴다.
 */
export function AppLoadingBar({
  className,
  trackClassName,
}: AppLoadingBarProps) {
  const isPresent = useIsPresent();

  return (
    <div
      className={cn(
        "h-1 w-full overflow-hidden rounded-full bg-zinc-800/90",
        trackClassName,
        className,
      )}
    >
      <div
        className={cn(
          "h-full w-2/5 rounded-full bg-teal-500 shadow-[0_0_14px_rgba(20,184,166,0.4)]",
          isPresent && "app-loading-bar-indeterminate-fill",
          !isPresent && "app-loading-bar-indeterminate-fill-idle",
        )}
      />
    </div>
  );
}

export type AppLoadingStateProps = {
  message?: string;
  /** standalone: 중앙 정렬(페이지·가드). embedded: 카드·섹션 안 전체 너비 */
  layout?: "standalone" | "embedded";
  className?: string;
};

/** progress 막대 + 안내 문구 — 앱 전역 로딩 UI */
export function AppLoadingState({
  message = "불러오는 중…",
  layout = "standalone",
  className,
}: AppLoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
      className={cn(
        layout === "standalone" &&
          "mx-auto flex w-full max-w-sm flex-col gap-4",
        layout === "embedded" && "w-full space-y-3",
        className,
      )}
    >
      <AppLoadingBar />
      <p
        className={cn(
          "text-sm text-zinc-500",
          layout === "standalone" && "text-center",
        )}
      >
        {message}
      </p>
    </div>
  );
}
