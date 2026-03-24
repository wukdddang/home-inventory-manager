"use client";

import { toast } from "@/hooks/use-toast";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import {
  getAppSettings,
  getPurchases,
  getShoppingList,
  setShoppingList,
  subscribeAppSettings,
  subscribePurchases,
  subscribeShoppingList,
} from "@/lib/local-store";
import {
  computeShoppingSuggestions,
  isInventoryItemOnShoppingList,
  type ShoppingSuggestion,
} from "@/lib/shopping-suggestions";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SETTINGS,
  type Household,
  type ShoppingListEntry,
} from "@/types/domain";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import {
  getMockPurchasesSession,
  subscribeMockPurchasesSession,
} from "../../../purchases/_lib/mock-purchases-session-store";

function reasonLabel(r: ShoppingSuggestion["reasons"][number]): string {
  if (r === "expiring_soon") return "유통기한 임박";
  return "재고 부족";
}

function reasonBadgeClass(r: ShoppingSuggestion["reasons"][number]): string {
  if (r === "expiring_soon") {
    return "bg-violet-500/20 text-violet-200/95 ring-1 ring-violet-400/25";
  }
  return "bg-amber-500/20 text-amber-100/95 ring-1 ring-amber-400/35";
}

function formatItemCaption(it: ShoppingSuggestion["item"]): string {
  const parts = [it.variantCaption].filter(Boolean);
  return parts.join(" · ");
}

function appendInventoryToShoppingList(
  household: Household,
  item: ShoppingSuggestion["item"],
  restockQuantity: number,
): boolean {
  const list = getShoppingList();
  if (isInventoryItemOnShoppingList(list, household.id, item)) return false;
  const row: ShoppingListEntry = {
    id: crypto.randomUUID(),
    householdId: household.id,
    inventoryItemId: item.id,
    label: item.name,
    unit: item.unit,
    variantCaption: item.variantCaption,
    categoryId: item.categoryId,
    productId: item.productId,
    productVariantId: item.productVariantId,
    restockQuantity: Math.max(1, Math.floor(restockQuantity)),
    createdAt: new Date().toISOString(),
    targetStorageLocationId: item.storageLocationId,
  };
  setShoppingList([...list, row]);
  return true;
}

export type ShoppingListSuggestionsCardProps = {
  household: Household;
  dataMode: "mock" | "api";
  /** 플로팅 패널 등 좁은 레이아웃 */
  compact?: boolean;
};

export function ShoppingListSuggestionsCard({
  household,
  dataMode,
  compact = false,
}: ShoppingListSuggestionsCardProps) {
  const prefix = useAppRoutePrefix();

  const purchases = useSyncExternalStore(
    dataMode === "mock" ? subscribeMockPurchasesSession : subscribePurchases,
    () => (dataMode === "mock" ? getMockPurchasesSession() : getPurchases()),
    () => [],
  );

  const settings = useSyncExternalStore(
    subscribeAppSettings,
    getAppSettings,
    () => DEFAULT_SETTINGS,
  );

  const shoppingAll = useSyncExternalStore(
    subscribeShoppingList,
    getShoppingList,
    () => [],
  );

  const suggestions = useMemo(
    () =>
      computeShoppingSuggestions(
        household,
        purchases,
        shoppingAll,
        settings.notificationDetail,
      ),
    [household, purchases, shoppingAll, settings.notificationDetail],
  );

  if (suggestions.length === 0) return null;

  const rowBtn =
    "shrink-0 cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-colors bg-teal-600 text-white hover:bg-teal-500";

  return (
    <section
      className={cn(
        "rounded-xl border border-violet-500/25 bg-violet-950/20 ring-1 ring-violet-500/10",
        compact ? "mb-3 p-2.5 sm:p-3" : "mb-4 p-3 sm:p-4",
      )}
      aria-label="장보기 제안"
    >
      <h3
        className={cn(
          "font-semibold tracking-tight text-violet-200",
          compact ? "text-xs" : "text-sm",
        )}
      >
        장보기에 담을 만한 재고
      </h3>
      <p
        className={cn(
          "mt-1 text-zinc-500",
          compact ? "text-[10px] leading-snug" : "text-[11px] leading-relaxed",
        )}
      >
        연결된 구매 로트 기준으로 유통기한이 곧 다가오거나, 품목에 적어 둔 최소
        재고보다 수량이 적으면 여기서 재고 단위로 담을 수 있습니다. 임박 기준
        일수는{" "}
        <Link
          href={`${prefix}/settings`}
          className="font-medium text-teal-400/90 underline-offset-2 hover:underline"
        >
          설정 → 알림
        </Link>
        과 같습니다.
      </p>
      <ul
        className={cn(
          "mt-2 flex flex-col gap-1.5",
          compact ? "gap-1.5" : "gap-2",
        )}
      >
        {suggestions.map((s) => (
          <li
            key={s.item.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-violet-500/15 bg-zinc-950/50 px-2.5 py-2 sm:px-3"
          >
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate font-medium text-zinc-100",
                  compact ? "text-xs" : "text-sm",
                )}
              >
                {s.item.name}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                {s.reasons.map((r) => (
                  <span
                    key={r}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium",
                      reasonBadgeClass(r),
                    )}
                  >
                    {reasonLabel(r)}
                  </span>
                ))}
              </div>
              <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                {formatItemCaption(s.item) ? (
                  <>
                    {formatItemCaption(s.item)} · {s.item.quantity}
                    {s.item.unit}
                  </>
                ) : (
                  <>
                    {s.item.quantity}
                    {s.item.unit}
                  </>
                )}
                {s.reasons.includes("expiring_soon") &&
                s.worstExpiryDays !== null ? (
                  <>
                    {" "}
                    · 가장 급한 로트 {s.worstExpiryDays}일 남음
                  </>
                ) : null}
                {s.reasons.includes("low_stock") &&
                s.item.minStockLevel != null ? (
                  <>
                    {" "}
                    · 최소 {s.item.minStockLevel}
                    {s.item.unit}
                  </>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              className={rowBtn}
              onClick={() => {
                const ok = appendInventoryToShoppingList(
                  household,
                  s.item,
                  s.suggestedRestock,
                );
                if (!ok) {
                  toast({
                    title: "이미 장보기에 있습니다",
                    variant: "warning",
                  });
                  return;
                }
                toast({
                  title: "장보기에 담았습니다",
                  description: `${s.item.name} · 보충 ${s.suggestedRestock}`,
                });
              }}
            >
              담기
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
