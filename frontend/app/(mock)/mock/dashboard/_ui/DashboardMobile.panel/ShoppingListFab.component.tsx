"use client";

import { BottomSheet } from "@/app/_ui/mobile/BottomSheet.component";
import { getShoppingList, setShoppingList } from "@/lib/local-store";
import { useDashboard } from "../../_hooks/useDashboard";
import { ShoppingCart, Check } from "lucide-react";
import type { Household, ShoppingListEntry } from "@/types/domain";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { subscribeShoppingList } from "@/lib/local-store";
import { usePathname } from "next/navigation";

type ShoppingListFabProps = {
  household: Household;
};

/** API에서 장보기 항목을 가져와 ShoppingListEntry 형태로 변환 */
async function fetchApiShoppingItems(
  householdId: string,
): Promise<ShoppingListEntry[]> {
  try {
    const res = await fetch(`/api/households/${householdId}/shopping-list-items`);
    const json = await res.json();
    if (!json.success) return [];
    return (json.data as Array<{
      id: string;
      memo: string | null;
      quantity: number | null;
      sourceInventoryItemId: string | null;
      createdAt?: string;
    }>).map((item) => ({
      id: item.id,
      householdId,
      inventoryItemId: item.sourceInventoryItemId ?? null,
      label: item.memo ?? "품목",
      restockQuantity: item.quantity ?? 1,
      createdAt: item.createdAt ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export function ShoppingListFab({ household }: ShoppingListFabProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isMock = pathname.startsWith("/mock");

  // localStorage 기반 (mock 모드)
  const allLocalEntries = useSyncExternalStore(
    subscribeShoppingList,
    getShoppingList,
    () => [] as ShoppingListEntry[],
  );

  // API 기반 (current 모드)
  const [apiEntries, setApiEntries] = useState<ShoppingListEntry[]>([]);
  const loadApiEntries = useCallback(() => {
    if (!isMock && household.id) {
      fetchApiShoppingItems(household.id).then(setApiEntries);
    }
  }, [isMock, household.id]);
  useEffect(() => { loadApiEntries(); }, [loadApiEntries]);

  const { 재고_장보기_보충을_기록_한다 } = useDashboard();

  const entries = useMemo(() => {
    if (isMock) {
      return allLocalEntries.filter((e) => e.householdId === household.id);
    }
    return apiEntries;
  }, [isMock, allLocalEntries, apiEntries, household.id]);

  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleComplete = async () => {
    const toComplete = entries.filter((e) => checked.has(e.id));

    if (isMock) {
      for (const entry of toComplete) {
        if (entry.inventoryItemId) {
          재고_장보기_보충을_기록_한다(
            household.id,
            entry.inventoryItemId,
            entry.restockQuantity,
            "장보기 완료 (모바일)",
          );
        }
      }
      const remaining = allLocalEntries.filter((e) => !checked.has(e.id));
      setShoppingList(remaining);
    } else {
      // API 모드: 각 항목별 complete API 호출
      await Promise.all(
        toComplete.map(async (entry) => {
          await fetch(
            `/api/households/${household.id}/shopping-list-items/${entry.id}/complete`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                inventoryItemId: entry.inventoryItemId ?? null,
                quantity: entry.restockQuantity,
              }),
            },
          ).catch(() => {});
        }),
      );
      // API 항목 다시 불러오기
      loadApiEntries();
    }

    setChecked(new Set());
    const remainingCount = entries.filter((e) => !checked.has(e.id)).length;
    if (remainingCount === 0) {
      setOpen(false);
    }
  };

  if (entries.length === 0) return null;

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        type="button"
        onClick={() => {
          setChecked(new Set());
          setOpen(true);
        }}
        className="fixed right-4 bottom-24 z-30 flex cursor-pointer items-center gap-2 rounded-full bg-teal-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-teal-900/40 transition-colors hover:bg-teal-500"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <ShoppingCart className="size-4" />
        장보기 ({entries.length})
      </button>

      {/* 바텀시트 */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="장보기 목록"
      >
        <div className="flex flex-col gap-2">
          {entries.map((entry) => {
            const isChecked = checked.has(entry.id);
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => toggleCheck(entry.id)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                  isChecked ? "bg-teal-500/10" : "hover:bg-zinc-800"
                }`}
              >
                <div
                  className={`flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    isChecked
                      ? "border-teal-500 bg-teal-500"
                      : "border-zinc-600"
                  }`}
                >
                  {isChecked && <Check className="size-3 text-white" />}
                </div>
                <span
                  className={`flex-1 text-sm ${
                    isChecked
                      ? "text-zinc-500 line-through"
                      : "text-zinc-200"
                  }`}
                >
                  {entry.label ?? "품목"}
                  {entry.variantCaption && (
                    <span className="ml-1 text-zinc-500">
                      {entry.variantCaption}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-zinc-400">
                  x{entry.restockQuantity}
                </span>
              </button>
            );
          })}
        </div>

        {checked.size > 0 && (
          <button
            type="button"
            onClick={handleComplete}
            className="mt-4 w-full cursor-pointer rounded-xl bg-teal-600 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-500"
          >
            장보기 완료 ({checked.size}건)
          </button>
        )}
      </BottomSheet>
    </>
  );
}
