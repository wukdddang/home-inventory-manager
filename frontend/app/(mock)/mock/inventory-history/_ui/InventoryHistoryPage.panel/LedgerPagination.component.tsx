"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function LedgerPagination({
  pageIndex,
  totalPages,
  onPrev,
  onNext,
  onGoToPage,
}: {
  pageIndex: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
}) {
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;
  return (
    <nav
      className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2"
      aria-label="페이지네이션"
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className="inline-flex h-8 cursor-pointer items-center gap-0.5 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-xs font-medium text-zinc-200 transition-colors hover:border-teal-500/50 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="size-3.5 shrink-0" aria-hidden />
        이전
      </button>
      {totalPages <= 8 ? (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: totalPages }, (_, p) => {
            const active = p === pageIndex;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onGoToPage(p)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border text-xs font-semibold tabular-nums transition-colors ${
                  active
                    ? "border-teal-500/60 bg-teal-500/15 text-teal-200"
                    : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                {p + 1}
              </button>
            );
          })}
        </div>
      ) : (
        <span className="px-1 text-xs font-medium tabular-nums text-zinc-300">
          {pageIndex + 1} / {totalPages}
        </span>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="inline-flex h-8 cursor-pointer items-center gap-0.5 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-xs font-medium text-zinc-200 transition-colors hover:border-teal-500/50 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        다음
        <ChevronRight className="size-3.5 shrink-0" aria-hidden />
      </button>
    </nav>
  );
}
