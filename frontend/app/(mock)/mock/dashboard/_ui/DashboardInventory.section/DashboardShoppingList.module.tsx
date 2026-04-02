"use client";

import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import { toast } from "@/hooks/use-toast";
import { formatShoppingListTargetStorage } from "@/lib/household-location";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import {
  getShoppingList,
  setShoppingList,
  subscribeShoppingList,
} from "@/lib/local-store";
import { inventoryDisplayLine } from "@/lib/product-catalog-helpers";
import type {
  Household,
  InventoryRow,
  ProductCatalog,
  ShoppingListEntry,
} from "@/types/domain";
import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { ShoppingListSuggestionsCard } from "./ShoppingListSuggestions.module";
import { syncShoppingListFromApi } from "@/app/api/households/[householdId]/shopping-list-items/route.adapter";

function catalogVariantKey(productId: string, variantId: string) {
  return `${productId}\0${variantId}`;
}

export type ShoppingListQuickAddFromCatalogModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  household: Household;
  catalog: ProductCatalog;
  /** 재고 추가 폼과 동기화된 선택값(이미 해석된 id) */
  categoryId: string;
  productId: string;
  variantId: string;
};

export type DashboardShoppingListModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  household: Household | null;
  /** true면 목록만 표시(구매 완료·삭제 비활성). 필요 시 스토리북·데모용 */
  readOnly?: boolean;
};

function formatItemCaption(it: InventoryRow): string {
  const parts = [it.variantCaption].filter(Boolean);
  return parts.join(" · ");
}

function useShoppingListDerived(household: Household) {
  const savedAll = useSyncExternalStore(
    subscribeShoppingList,
    getShoppingList,
    () => [],
  );

  const saved = useMemo(
    () => savedAll.filter((e) => e.householdId === household.id),
    [savedAll, household.id],
  );

  const linkedInventoryIds = useMemo(() => {
    const s = new Set<string>();
    for (const e of saved) {
      if (e.inventoryItemId) s.add(e.inventoryItemId);
    }
    return s;
  }, [saved]);

  const linkedCatalogVariantKeys = useMemo(() => {
    const s = new Set<string>();
    for (const e of saved) {
      if (e.productId && e.productVariantId) {
        s.add(catalogVariantKey(e.productId, e.productVariantId));
      }
    }
    return s;
  }, [saved]);

  const depletedItems = useMemo(() => {
    return household.items
      .filter((it) => {
        if (it.quantity !== 0) return false;
        if (linkedInventoryIds.has(it.id)) return false;
        if (
          it.productId &&
          it.productVariantId &&
          linkedCatalogVariantKeys.has(
            catalogVariantKey(it.productId, it.productVariantId),
          )
        ) {
          return false;
        }
        return true;
      })
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [household.items, linkedInventoryIds, linkedCatalogVariantKeys]);

  return { saved, depletedItems };
}

/** `readOnly` 모드 — 목록만 표시 */
function ShoppingListDetailReadOnly({ household }: { household: Household }) {
  const { saved, depletedItems } = useShoppingListDerived(household);
  const hasRows = depletedItems.length > 0 || saved.length > 0;

  return (
    <div
      className="flex min-w-0 flex-col gap-4"
      aria-label="장보기 목록 (읽기)"
    >
      <p className="text-sm leading-relaxed text-zinc-300">
        결제가 아니라 살 것·다 쓴 품목을 모아 두는 목록입니다. 이 모드에서는
        목록만 보입니다.
      </p>

      {!hasRows ? (
        <p className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-3 text-center text-sm text-zinc-300">
          목록이 비어 있어요. 수량이 0인 품목은 자동으로 표시됩니다.
        </p>
      ) : null}

      {depletedItems.length > 0 ? (
        <div className="min-w-0">
          <h3 className="text-xs font-semibold tracking-wide text-amber-200/90 uppercase">
            재고 없음 (자동)
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {depletedItems.map((it) => (
              <li
                key={it.id}
                className="rounded-lg border border-amber-500/20 bg-zinc-950/60 px-3 py-2"
              >
                <p className="truncate text-sm font-medium text-zinc-100">
                  {it.name}
                </p>
                {formatItemCaption(it) ? (
                  <p className="truncate text-xs text-zinc-300">
                    {formatItemCaption(it)} · {it.unit}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-300">{it.unit}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {saved.length > 0 ? (
        <div className="min-w-0">
          <h3 className="text-xs font-semibold tracking-wide text-teal-200/80 uppercase">
            직접 담은 항목
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {saved.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-zinc-700/80 bg-zinc-950/50 px-3 py-2"
              >
                <p className="truncate text-sm font-medium text-zinc-100">
                  {entry.label}
                  {entry.inventoryItemId ? null : entry.productId &&
                    entry.productVariantId ? (
                    <span className="ml-1.5 text-xs font-normal text-teal-400/90">
                      (카탈로그)
                    </span>
                  ) : (
                    <span className="ml-1.5 text-xs font-normal text-zinc-300">
                      (메모)
                    </span>
                  )}
                </p>
                {entry.targetStorageLocationId ? (
                  <p className="truncate text-xs text-teal-400/85">
                    넣을 보관 장소 ·{" "}
                    {formatShoppingListTargetStorage(
                      household,
                      entry.targetStorageLocationId,
                    )}
                  </p>
                ) : null}
                <p className="truncate text-xs text-zinc-300">
                  {entry.variantCaption ? `${entry.variantCaption} · ` : ""}
                  보충 수량 {entry.restockQuantity}
                  {entry.inventoryItemId
                    ? ` · ${entry.unit ?? "단위"}`
                    : entry.productId && entry.productVariantId
                      ? ` · ${entry.unit ?? "단위"}`
                      : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ShoppingListAddFromDashboardHint() {
  const prefix = useAppRoutePrefix();
  return (
    <div className="border-t border-zinc-800 pt-4">
      <p className="text-xs font-medium text-zinc-300">항목 추가</p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">
        목록에 품목을 담으려면 메인(대시보드)에서 거점·방을 선택한 뒤, 화면의
        <span className="font-medium text-zinc-200">「재고 등록」</span>{" "}
        패널에서 카탈로그를 고르고
        <span className="font-medium text-zinc-200">「장보기에만 담기」</span>를
        사용하세요.
      </p>
      <p className="mt-2 text-xs text-zinc-300">
        <Link
          href={`${prefix}/dashboard`}
          className="font-medium text-teal-400/90 underline-offset-2 hover:underline"
        >
          메인(대시보드)으로 이동
        </Link>
      </p>
    </div>
  );
}

function ShoppingListDetailContent({ household }: { household: Household }) {
  const {
    dataMode,
    재고_장보기_보충을_기록_한다,
    장보기_수량을_수정_한다,
    장보기_항목을_삭제_한다,
    장보기_구매를_완료_한다,
  } = useDashboard();
  const [depletedQty, setDepletedQty] = useState<Record<string, number>>({});
  const { saved, depletedItems } = useShoppingListDerived(household);

  useEffect(() => {
    if (dataMode === "api") {
      syncShoppingListFromApi(household.id);
    }
  }, [dataMode, household.id]);

  const getDepletedRestock = (itemId: string) => {
    const q = depletedQty[itemId];
    return q != null && q >= 1 ? q : 1;
  };

  const setDepletedRestock = (itemId: string, raw: number) => {
    const n = Math.floor(raw);
    if (!Number.isFinite(n) || n < 1) return;
    setDepletedQty((prev) => ({ ...prev, [itemId]: n }));
  };

  const updateSavedRestock = (entryId: string, raw: number) => {
    const n = Math.floor(raw);
    if (!Number.isFinite(n) || n < 1) return;
    const next = getShoppingList().map((e) =>
      e.id === entryId ? { ...e, restockQuantity: n } : e,
    );
    setShoppingList(next);
    장보기_수량을_수정_한다(household.id, entryId, n);
  };

  const removeSaved = (entryId: string) => {
    setShoppingList(getShoppingList().filter((e) => e.id !== entryId));
    장보기_항목을_삭제_한다(household.id, entryId);
  };

  const completeLinked = (
    inventoryItemId: string,
    qty: number,
    opts?: { removeEntryId?: string; label: string },
  ) => {
    const ok = 재고_장보기_보충을_기록_한다(
      household.id,
      inventoryItemId,
      qty,
      "장보기 구매 완료",
      opts?.removeEntryId,
    );
    if (!ok) {
      toast({
        title: "보충할 수 없습니다",
        description: "재고 품목이 없어졌는지 확인하세요.",
        variant: "warning",
      });
      return;
    }
    if (opts?.removeEntryId) {
      removeSaved(opts.removeEntryId);
    }
    toast({
      title: "재고를 보충했습니다",
      description: `${opts?.label ?? ""} +${qty}`,
    });
  };

  const completeSaved = (entry: ShoppingListEntry) => {
    // 재고 연결된 inventoryItemId 결정
    let linkedItemId = entry.inventoryItemId ?? null;
    if (!linkedItemId && entry.productId && entry.productVariantId) {
      const match = household.items.find(
        (i) =>
          i.productId === entry.productId &&
          i.productVariantId === entry.productVariantId,
      );
      if (match) linkedItemId = match.id;
    }

    if (linkedItemId) {
      // 로컬 재고 수량 반영 (UI 즉시 갱신)
      completeLinked(linkedItemId, entry.restockQuantity, {
        label: entry.label ?? "",
      });
      // port 호출 (mock: no-op, api: 백엔드 트랜잭션 처리)
      장보기_구매를_완료_한다(household.id, entry.id, {
        inventoryItemId: linkedItemId,
        quantity: entry.restockQuantity,
      }).catch((e) => console.error("장보기 완료 오류:", e));
      // 로컬 장보기 목록에서 제거 (port의 삭제 API와 별개로 localStorage 정리)
      setShoppingList(getShoppingList().filter((e) => e.id !== entry.id));
      return;
    }

    // 재고 미연결 — 목록만 정리
    removeSaved(entry.id);
    toast({
      title: "목록에서 뺐습니다",
      description: `${entry.label ?? ""} — 재고에 같은 품목이 없어 수량은 바뀌지 않습니다. 재고 추가로 넣은 뒤 다시 완료하세요.`,
    });
  };

  const completeDepleted = (it: InventoryRow) => {
    const qty = getDepletedRestock(it.id);
    completeLinked(it.id, qty, { label: it.name });
  };

  const rowBtn =
    "cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-colors";
  const hasRows = depletedItems.length > 0 || saved.length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-5" aria-label="장보기 상세">
      <p className="text-sm leading-relaxed text-zinc-300">
        결제가 아니라 살 것·다 쓴 품목을 모아 두는 목록입니다. 사 온 뒤「구매
        완료」하면 재고 수량이 늘고, 이력에는 입고로 남습니다.
      </p>

      <ShoppingListSuggestionsCard household={household} />

      {!hasRows ? (
        <p className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-3 text-center text-sm text-zinc-300">
          목록이 비어 있어요. 항목을 담는 방법은 아래에 안내해 두었습니다.
          수량이 0인 품목은 자동으로 표시됩니다.
        </p>
      ) : null}

      {depletedItems.length > 0 ? (
        <div className="min-w-0">
          <h3 className="text-xs font-semibold tracking-wide text-amber-200/90 uppercase">
            재고 없음 (자동)
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {depletedItems.map((it) => (
              <li
                key={it.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/20 bg-zinc-950/60 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {it.name}
                  </p>
                  {formatItemCaption(it) ? (
                    <p className="truncate text-xs text-zinc-300">
                      {formatItemCaption(it)} · {it.unit}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-300">{it.unit}</p>
                  )}
                </div>
                <label className="flex items-center gap-1 text-xs text-zinc-300">
                  <span className="whitespace-nowrap">보충</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={getDepletedRestock(it.id)}
                    onChange={(ev) =>
                      setDepletedRestock(it.id, Number(ev.target.value))
                    }
                    className="w-14 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-xs text-zinc-100"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => completeDepleted(it)}
                  className={`${rowBtn} bg-teal-600 text-white hover:bg-teal-500`}
                >
                  구매 완료
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {saved.length > 0 ? (
        <div className="min-w-0">
          <h3 className="text-xs font-semibold tracking-wide text-teal-200/80 uppercase">
            직접 담은 항목
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {saved.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-950/50 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {entry.label}
                    {entry.inventoryItemId ? null : entry.productId &&
                      entry.productVariantId ? (
                      <span className="ml-1.5 text-xs font-normal text-teal-400/90">
                        (카탈로그)
                      </span>
                    ) : (
                      <span className="ml-1.5 text-xs font-normal text-zinc-300">
                        (메모)
                      </span>
                    )}
                  </p>
                  {entry.targetStorageLocationId ? (
                    <p className="truncate text-xs text-teal-400/85">
                      넣을 보관 장소 ·{" "}
                      {formatShoppingListTargetStorage(
                        household,
                        entry.targetStorageLocationId,
                      )}
                    </p>
                  ) : null}
                  <p className="truncate text-xs text-zinc-300">
                    {entry.variantCaption ? `${entry.variantCaption} · ` : ""}
                    {entry.inventoryItemId
                      ? (entry.unit ?? "단위")
                      : entry.productId && entry.productVariantId
                        ? `${entry.unit ?? "단위"} · 재고에 넣으면 완료 시 보충`
                        : "재고 미연결 — 완료 시 목록만 정리"}
                  </p>
                </div>
                {entry.inventoryItemId ||
                (entry.productId && entry.productVariantId) ? (
                  <label className="flex items-center gap-1 text-xs text-zinc-300">
                    <span className="whitespace-nowrap">보충</span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={entry.restockQuantity}
                      onChange={(ev) =>
                        updateSavedRestock(entry.id, Number(ev.target.value))
                      }
                      className="w-14 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-xs text-zinc-100"
                    />
                  </label>
                ) : null}
                <button
                  type="button"
                  onClick={() => completeSaved(entry)}
                  className={`${rowBtn} bg-teal-600 text-white hover:bg-teal-500`}
                >
                  구매 완료
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeSaved(entry.id);
                    toast({
                      title: "목록에서 뺐습니다",
                      description: entry.label,
                    });
                  }}
                  className={`${rowBtn} border border-zinc-600 text-zinc-300 hover:bg-zinc-800`}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ShoppingListAddFromDashboardHint />
    </div>
  );
}

export function ShoppingListQuickAddFromCatalogModal({
  open,
  onOpenChange,
  household,
  catalog,
  categoryId,
  productId,
  variantId,
}: ShoppingListQuickAddFromCatalogModalProps) {
  const { 장보기_항목을_추가_한다 } = useDashboard();
  const titleId = useId().replace(/:/g, "");
  const descId = useId().replace(/:/g, "");
  const [qtyDraft, setQtyDraft] = useState("1");

  const resolved = useMemo(() => {
    const variant = catalog.variants.find((v) => v.id === variantId);
    const product = catalog.products.find((p) => p.id === productId);
    const category = catalog.categories.find((c) => c.id === categoryId);
    const unit =
      variant != null
        ? catalog.units.find((u) => u.id === variant.unitId)
        : undefined;
    if (!variant || !product || !category || !unit) {
      return null;
    }
    const variantCaption =
      variant.name ?? `${variant.quantityPerUnit}${unit.symbol}`;
    const stub: InventoryRow = {
      id: "draft",
      name: "",
      quantity: 0,
      unit: unit.symbol,
      roomId: "",
      categoryId: category.id,
      productId: product.id,
      productVariantId: variant.id,
      variantCaption,
      quantityPerUnit: variant.quantityPerUnit,
    };
    stub.name = inventoryDisplayLine(catalog, stub);
    return {
      variant,
      product,
      category,
      unit,
      variantCaption,
      label: stub.name,
    };
  }, [catalog, categoryId, productId, variantId]);

  const handleAdd = () => {
    if (!resolved) {
      toast({
        title: "선택을 완료해 주세요",
        description: "카테고리·품목·용량·포장을 모두 고른 뒤 다시 열어 주세요.",
        variant: "warning",
      });
      return;
    }
    const n = Math.max(1, Math.floor(Number(qtyDraft) || 0));
    const list = getShoppingList();
    if (
      list.some(
        (e) =>
          e.householdId === household.id &&
          e.productId === resolved.product.id &&
          e.productVariantId === resolved.variant.id,
      )
    ) {
      toast({
        title: "이미 장보기에 있습니다",
        variant: "warning",
      });
      return;
    }
    const row: ShoppingListEntry = {
      id: crypto.randomUUID(),
      householdId: household.id,
      inventoryItemId: null,
      label: resolved.label,
      unit: resolved.unit.symbol,
      variantCaption: resolved.variantCaption,
      categoryId: resolved.category.id,
      productId: resolved.product.id,
      productVariantId: resolved.variant.id,
      restockQuantity: n,
      createdAt: new Date().toISOString(),
    };
    setShoppingList([...list, row]);
    장보기_항목을_추가_한다(household.id, {
      label: row.label,
      unit: row.unit,
      variantCaption: row.variantCaption,
      categoryId: row.categoryId,
      productId: row.productId,
      productVariantId: row.productVariantId,
      restockQuantity: row.restockQuantity,
    });
    toast({
      title: "장보기에 담았습니다",
      description: resolved.label,
    });
    onOpenChange(false);
    setQtyDraft("1");
  };

  return (
    <MotionModalLayer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQtyDraft("1");
      }}
      closeOnOverlayClick
      panelClassName="fixed left-1/2 top-1/2 z-10041 w-[min(100vw-1.5rem,22rem)] max-w-[100vw] -translate-x-1/2 -translate-y-1/2 outline-none"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descId}
    >
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl">
        <h2 id={titleId} className="text-base font-semibold text-white">
          장보기에 담기
        </h2>
        <p id={descId} className="mt-2 text-sm leading-relaxed text-zinc-300">
          보관 장소·수량·유통기한 없이 목록에만 남깁니다. 헤더「장보기」에서
          구매 완료· 삭제를 할 수 있습니다.
        </p>

        {resolved ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-teal-500/25 bg-teal-950/25 px-3 py-2.5">
              <p className="text-xs font-medium text-teal-200/90">담을 품목</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">
                {resolved.label}
              </p>
            </div>
            <div className="space-y-1">
              <label
                htmlFor={`shopping-quick-qty-${titleId}`}
                className="text-xs font-medium text-zinc-300"
              >
                사 올 때 채울 수량 (용량·포장 기준)
              </label>
              <input
                id={`shopping-quick-qty-${titleId}`}
                type="number"
                min={1}
                step={1}
                value={qtyDraft}
                onChange={(e) => setQtyDraft(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
              >
                장보기에 담기
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90">
              위쪽 폼에서 카테고리·품목·용량·포장을 먼저 고른 뒤 다시 이 버튼을
              눌러 주세요.
            </p>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </MotionModalLayer>
  );
}

export function DashboardShoppingListModal({
  open,
  onOpenChange,
  household,
  readOnly = false,
}: DashboardShoppingListModalProps) {
  const titleId = useId().replace(/:/g, "");
  const descId = useId().replace(/:/g, "");

  return (
    <MotionModalLayer
      open={open}
      onOpenChange={onOpenChange}
      closeOnOverlayClick
      panelClassName="fixed left-1/2 top-1/2 z-10041 flex w-[min(100vw-1.5rem,28rem)] max-w-[100vw] -translate-x-1/2 -translate-y-1/2 outline-none sm:w-[min(100vw-2rem,36rem)]"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descId}
    >
      <div className="flex max-h-[min(92dvh,44rem)] w-full flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-4 py-4 sm:px-5">
          <div className="min-w-0 pr-2">
            <h2 id={titleId} className="text-lg font-semibold text-white">
              장보기
            </h2>
            <p id={descId} className="mt-1 text-sm text-zinc-300">
              {household
                ? `선택한 거점「${household.name}」기준 목록입니다.`
                : "대시보드에서 거점을 불러온 뒤 목록을 볼 수 있습니다."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 cursor-pointer rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            닫기
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5 sm:py-5">
          {household ? (
            readOnly ? (
              <ShoppingListDetailReadOnly
                key={household.id}
                household={household}
              />
            ) : (
              <ShoppingListDetailContent
                key={household.id}
                household={household}
              />
            )
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-6 text-center text-sm text-zinc-300">
              메인(대시보드)에서 거점을 선택한 상태로 다시 열어 주세요.
            </p>
          )}
        </div>
      </div>
    </MotionModalLayer>
  );
}
