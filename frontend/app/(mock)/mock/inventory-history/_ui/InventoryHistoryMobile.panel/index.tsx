"use client";

import { useInventoryHistory } from "../../_hooks/useInventoryHistory";
import { 이력_유형_라벨을_구한다 } from "../../_context/inventory-history-helpers.service";
import type { InventoryLedgerRow, InventoryLedgerType } from "@/types/domain";
import { useMemo, useState } from "react";

const TYPE_CONFIG: Record<
  InventoryLedgerType,
  { label: string; color: string; sign: string }
> = {
  in: { label: "입고", color: "text-emerald-400 bg-emerald-500/15", sign: "+" },
  out: { label: "소비", color: "text-blue-400 bg-blue-500/15", sign: "-" },
  adjust: { label: "조정", color: "text-amber-400 bg-amber-500/15", sign: "" },
  waste: { label: "폐기", color: "text-rose-400 bg-rose-500/15", sign: "-" },
};

type PeriodPreset = "today" | "week" | "month";

function getPresetRange(preset: PeriodPreset): { start: string; end: string } {
  const now = new Date();
  const end = formatDate(now);
  if (preset === "today") return { start: end, end };
  if (preset === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { start: formatDate(d), end };
  }
  const d = new Date(now);
  d.setDate(d.getDate() - 29);
  return { start: formatDate(d), end };
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateLabel(dateKey: string): string {
  const today = formatDate(new Date());
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatDate(d);
  })();
  if (dateKey === today) return `${dateKey} (오늘)`;
  if (dateKey === yesterday) return `${dateKey} (어제)`;
  return dateKey;
}

type GroupedByDate = { dateKey: string; rows: InventoryLedgerRow[] };

export function InventoryHistoryMobilePanel() {
  const ctx = useInventoryHistory();
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset | null>(null);
  const [typeFilter, setTypeFilter] = useState<InventoryLedgerType | "all">(
    "all",
  );

  // 기간 프리셋 적용
  const handlePreset = (preset: PeriodPreset) => {
    if (periodPreset === preset) {
      setPeriodPreset(null);
      ctx.기간을_초기화한다();
    } else {
      setPeriodPreset(preset);
      const range = getPresetRange(preset);
      ctx.기간_시작을_바꾼다(range.start);
      ctx.기간_종료를_바꾼다(range.end);
    }
  };

  // 유형 필터 적용
  const handleTypeFilter = (type: InventoryLedgerType | "all") => {
    setTypeFilter(type);
    if (type === "all") {
      ctx.컬럼_필터를_바꾼다("type", "");
    } else {
      ctx.컬럼_필터를_바꾼다("type", 이력_유형_라벨을_구한다(type));
    }
  };

  // 날짜별 그룹핑
  const grouped = useMemo<GroupedByDate[]>(() => {
    const map = new Map<string, InventoryLedgerRow[]>();
    for (const row of ctx.paginatedRows) {
      const dateKey = row.createdAt.slice(0, 10);
      const group = map.get(dateKey);
      if (group) group.push(row);
      else map.set(dateKey, [row]);
    }
    return Array.from(map, ([dateKey, rows]) => ({ dateKey, rows }));
  }, [ctx.paginatedRows]);

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:mx-auto md:w-full md:max-w-2xl">
      {/* 기간 필터 칩 */}
      <div className="flex gap-2">
        {(["today", "week", "month"] as const).map((preset) => {
          const labels = { today: "오늘", week: "이번주", month: "이번달" };
          return (
            <button
              key={preset}
              type="button"
              onClick={() => handlePreset(preset)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                periodPreset === preset
                  ? "bg-teal-500/15 text-teal-300"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {labels[preset]}
            </button>
          );
        })}
      </div>

      {/* 유형 필터 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => handleTypeFilter("all")}
          className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            typeFilter === "all"
              ? "bg-teal-500/15 text-teal-300"
              : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          전체
        </button>
        {(Object.keys(TYPE_CONFIG) as InventoryLedgerType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleTypeFilter(type)}
            className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              typeFilter === type
                ? "bg-teal-500/15 text-teal-300"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {TYPE_CONFIG[type].label}
          </button>
        ))}
      </div>

      {/* 타임라인 */}
      {grouped.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-sm text-zinc-500">표시할 이력이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(({ dateKey, rows }) => (
            <div key={dateKey} className="flex flex-col gap-2">
              {/* 날짜 구분선 */}
              <div className="flex items-center gap-2 py-1">
                <div className="size-2 rounded-full bg-zinc-600" />
                <span className="text-xs font-medium text-zinc-400">
                  {formatDateLabel(dateKey)}
                </span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              {/* 이력 카드 */}
              {rows.map((row) => {
                const config = TYPE_CONFIG[row.type];
                return (
                  <div
                    key={row.id}
                    className="ml-3 flex items-start gap-3 border-l border-zinc-800 py-2 pl-4"
                  >
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${config.color}`}
                    >
                      {config.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-200">
                        {row.itemLabel ?? "품목"}
                        <span className="ml-2 font-medium tabular-nums">
                          {config.sign}
                          {Math.abs(row.quantityDelta)}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {formatTime(row.createdAt)}
                        {row.reason && ` · ${row.reason}`}
                        {row.memo && ` · ${row.memo}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* 페이지네이션 */}
          {ctx.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-3">
              <button
                type="button"
                disabled={ctx.activePageIndex === 0}
                onClick={ctx.이전_페이지로_간다}
                className="cursor-pointer rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-xs tabular-nums text-zinc-500">
                {ctx.activePageIndex + 1} / {ctx.totalPages}
              </span>
              <button
                type="button"
                disabled={ctx.activePageIndex >= ctx.totalPages - 1}
                onClick={ctx.다음_페이지로_간다}
                className="cursor-pointer rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
