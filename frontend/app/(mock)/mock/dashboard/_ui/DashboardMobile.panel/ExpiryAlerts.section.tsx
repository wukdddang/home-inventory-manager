"use client";

import { useDashboard } from "../../_hooks/useDashboard";
import type { Household, InventoryRow } from "@/types/domain";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";

type ExpiryAlertsProps = {
  household: Household;
  onUse: (item: InventoryRow) => void;
  onWaste: (item: InventoryRow) => void;
};

export function ExpiryAlerts({ household, onUse, onWaste }: ExpiryAlertsProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { 거점_유통기한_임박_목록을_가져온다, 거점_만료_목록을_가져온다 } = useDashboard();

  const expiryItems = useMemo(() => {
    const expiring = 거점_유통기한_임박_목록을_가져온다(household.id);
    const expired = 거점_만료_목록을_가져온다(household.id);
    return [...expired, ...expiring].sort((a, b) => a.daysLeft - b.daysLeft);
  }, [household.id, 거점_유통기한_임박_목록을_가져온다, 거점_만료_목록을_가져온다]);

  if (expiryItems.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3"
      >
        <span className="text-sm font-medium text-amber-300">
          유통기한 임박 ({expiryItems.length})
        </span>
        {collapsed ? (
          <ChevronDown className="size-4 text-zinc-400" />
        ) : (
          <ChevronUp className="size-4 text-zinc-400" />
        )}
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-1 px-3 pb-3">
          {expiryItems.map(({ item, daysLeft, isExpired }) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg px-2 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`size-2 shrink-0 rounded-full ${
                    isExpired ? "bg-rose-500" : "bg-amber-500"
                  }`}
                />
                <span className="truncate text-sm text-zinc-200">
                  {item.name}
                  {item.variantCaption && (
                    <span className="ml-1 text-zinc-500">
                      {item.variantCaption}
                    </span>
                  )}
                </span>
                <span
                  className={`shrink-0 text-xs font-medium ${
                    isExpired ? "text-rose-400" : "text-amber-400"
                  }`}
                >
                  {isExpired
                    ? `만료 ${Math.abs(daysLeft)}일`
                    : daysLeft === 0
                      ? "오늘 만료"
                      : `D-${daysLeft}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => (isExpired ? onWaste(item) : onUse(item))}
                className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isExpired
                    ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                    : "bg-teal-500/15 text-teal-300 hover:bg-teal-500/25"
                }`}
              >
                {isExpired ? "폐기" : "사용"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
