"use client";

import type { InventoryLedgerType } from "@/types/domain";
import {
  구분_뱃지_클래스를_구한다,
  이력_유형_라벨을_구한다,
  증감_뱃지_클래스를_구한다,
} from "../../_context/inventory-history-helpers.service";

const 구분_순서: InventoryLedgerType[] = ["in", "out", "adjust", "waste"];

export function LedgerLegend({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex min-w-0 flex-nowrap items-center gap-x-2 gap-y-2 rounded-xl border border-zinc-700/90 bg-zinc-900/80 px-3 py-2 shadow-sm ${className}`.trim()}
      role="note"
      aria-label="표 범례"
    >
      <span className="shrink-0 text-xs font-semibold text-zinc-300">
        범례
      </span>
      <span className="shrink-0 text-xs text-zinc-300">증감</span>
      <span className={증감_뱃지_클래스를_구한다(1)}>+증가</span>
      <span className={증감_뱃지_클래스를_구한다(-1)}>-감소</span>
      <span
        className="mx-0.5 hidden h-4 w-px shrink-0 bg-zinc-700 sm:inline-block"
        aria-hidden
      />
      <span className="shrink-0 text-xs text-zinc-300">구분</span>
      {구분_순서.map((t) => (
        <span key={t} className={구분_뱃지_클래스를_구한다(t)}>
          {이력_유형_라벨을_구한다(t)}
        </span>
      ))}
    </div>
  );
}
