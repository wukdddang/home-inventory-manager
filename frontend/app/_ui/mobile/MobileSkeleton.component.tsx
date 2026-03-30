"use client";

/** 대시보드 모바일 스켈레톤 */
export function DashboardMobileSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 animate-pulse">
      {/* 검색 바 */}
      <div className="h-11 rounded-xl bg-zinc-800/60" />

      {/* 방 섹션 x 3 */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-zinc-800/50"
        >
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="h-4 w-12 rounded bg-zinc-800/80" />
            <div className="size-5 rounded-full bg-zinc-800/60" />
          </div>
          <div className="flex flex-col gap-1.5 px-3 pb-3">
            {[1, 2].map((j) => (
              <div
                key={j}
                className="h-16 rounded-lg bg-zinc-800/40"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 이력 모바일 스켈레톤 */
export function HistoryMobileSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 animate-pulse">
      {/* 필터 칩 */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-16 rounded-lg bg-zinc-800/60" />
        ))}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-12 rounded-lg bg-zinc-800/60" />
        ))}
      </div>

      {/* 날짜 그룹 x 2 */}
      {[1, 2].map((g) => (
        <div key={g} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 py-1">
            <div className="size-2 rounded-full bg-zinc-800/60" />
            <div className="h-3 w-28 rounded bg-zinc-800/60" />
            <div className="h-px flex-1 bg-zinc-800/40" />
          </div>
          {[1, 2, 3].map((r) => (
            <div
              key={r}
              className="ml-3 flex items-start gap-3 border-l border-zinc-800/40 py-2 pl-4"
            >
              <div className="h-5 w-10 rounded-md bg-zinc-800/60" />
              <div className="flex flex-1 flex-col gap-1">
                <div className="h-4 w-32 rounded bg-zinc-800/60" />
                <div className="h-3 w-20 rounded bg-zinc-800/40" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
