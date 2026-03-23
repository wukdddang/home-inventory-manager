"use client";

import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import { toast } from "@/hooks/use-toast";
import {
  getShoppingList,
  setShoppingList,
  subscribeShoppingList,
} from "@/lib/local-store";
import { inventoryDisplayLine } from "@/lib/product-catalog-defaults";
import type {
  Household,
  InventoryRow,
  ProductCatalog,
  ShoppingListEntry,
} from "@/types/domain";
import { useId, useMemo, useState, useSyncExternalStore } from "react";
import { useDashboard } from "../../_hooks/useDashboard";

function catalogVariantKey(productId: string, variantId: string) {
  return `${productId}\0${variantId}`;
}

export type ShoppingListQuickAddFromCatalogModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  household: Household;
  catalog: ProductCatalog;
  /** 물품 추가 폼과 동기화된 선택값(이미 해석된 id) */
  categoryId: string;
  productId: string;
  variantId: string;
};

export type DashboardShoppingListModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  household: Household | null;
  /** true면 목록만 표시(항목 추가·구매 완료 등 비활성). 셸 등 Provider 밖에서 사용 */
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

/** 상단 앱 셸 등 `DashboardProvider` 밖에서 열 때 — 로컬·재고만 표시, `useDashboard` 없음 */
function ShoppingListDetailReadOnly({ household }: { household: Household }) {
  const { saved, depletedItems } = useShoppingListDerived(household);
  const hasRows = depletedItems.length > 0 || saved.length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-4" aria-label="장보기 목록 (읽기)">
      <p className="text-sm leading-relaxed text-zinc-400">
        결제가 아니라 살 것·다 쓴 품목을 모아 두는 목록입니다. 이 창에서는 목록만
        보입니다. 항목 추가·구매 완료·삭제는 대시보드에서 진행할 수 있습니다.
      </p>

      {!hasRows ? (
        <p className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-3 text-center text-sm text-zinc-500">
          목록이 비어 있어요. 수량이 0인 품목은 자동으로 표시됩니다.
        </p>
      ) : null}

      {depletedItems.length > 0 ? (
        <div className="min-w-0">
          <h3 className="text-[10px] font-semibold tracking-wide text-amber-200/90 uppercase">
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
                  <p className="truncate text-[11px] text-zinc-500">
                    {formatItemCaption(it)} · {it.unit}
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-500">{it.unit}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {saved.length > 0 ? (
        <div className="min-w-0">
          <h3 className="text-[10px] font-semibold tracking-wide text-teal-200/80 uppercase">
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
                    <span className="ml-1.5 text-[10px] font-normal text-teal-400/90">
                      (카탈로그)
                    </span>
                  ) : (
                    <span className="ml-1.5 text-[10px] font-normal text-zinc-500">
                      (메모)
                    </span>
                  )}
                </p>
                <p className="truncate text-[11px] text-zinc-500">
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

function ShoppingListDetailContent({ household }: { household: Household }) {
  const { 재고_장보기_보충을_기록_한다 } = useDashboard();
  const [freeText, setFreeText] = useState("");
  const [pickItemId, setPickItemId] = useState("");
  const [depletedQty, setDepletedQty] = useState<Record<string, number>>({});
  const { saved, depletedItems } = useShoppingListDerived(household);

  const pickCandidates = useMemo(() => {
    return household.items
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [household.items]);

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
  };

  const removeSaved = (entryId: string) => {
    setShoppingList(getShoppingList().filter((e) => e.id !== entryId));
  };

  const addFreeText = () => {
    const label = freeText.trim();
    if (!label) {
      toast({
        title: "이름을 입력하세요",
        variant: "warning",
      });
      return;
    }
    const row: ShoppingListEntry = {
      id: crypto.randomUUID(),
      householdId: household.id,
      inventoryItemId: null,
      label,
      restockQuantity: 1,
      createdAt: new Date().toISOString(),
    };
    setShoppingList([...getShoppingList(), row]);
    setFreeText("");
    toast({ title: "장보기에 담았습니다", description: label });
  };

  const addFromInventory = () => {
    if (!pickItemId) {
      toast({
        title: "품목을 고르세요",
        variant: "warning",
      });
      return;
    }
    const it = household.items.find((i) => i.id === pickItemId);
    if (!it) return;
    if (saved.some((e) => e.inventoryItemId === pickItemId)) {
      toast({
        title: "이미 목록에 있습니다",
        description: "같은 재고 품목은 한 줄로 합쳐 주세요.",
        variant: "warning",
      });
      return;
    }
    if (
      it.productId &&
      it.productVariantId &&
      saved.some(
        (e) =>
          e.productId === it.productId &&
          e.productVariantId === it.productVariantId,
      )
    ) {
      toast({
        title: "이미 목록에 있습니다",
        description: "같은 품목·용량이 장보기에 담겨 있습니다.",
        variant: "warning",
      });
      return;
    }
    const row: ShoppingListEntry = {
      id: crypto.randomUUID(),
      householdId: household.id,
      inventoryItemId: it.id,
      label: it.name,
      unit: it.unit,
      variantCaption: it.variantCaption,
      categoryId: it.categoryId,
      productId: it.productId,
      productVariantId: it.productVariantId,
      restockQuantity: 1,
      createdAt: new Date().toISOString(),
    };
    setShoppingList([...getShoppingList(), row]);
    setPickItemId("");
    toast({ title: "장보기에 담았습니다", description: it.name });
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
    if (entry.inventoryItemId) {
      completeLinked(entry.inventoryItemId, entry.restockQuantity, {
        removeEntryId: entry.id,
        label: entry.label,
      });
      return;
    }
    if (entry.productId && entry.productVariantId) {
      const matches = household.items.filter(
        (i) =>
          i.productId === entry.productId &&
          i.productVariantId === entry.productVariantId,
      );
      if (matches.length >= 1) {
        completeLinked(matches[0].id, entry.restockQuantity, {
          removeEntryId: entry.id,
          label: entry.label,
        });
        return;
      }
    }
    removeSaved(entry.id);
    toast({
      title: "목록에서 뺐습니다",
      description: `${entry.label} — 재고에 같은 품목이 없어 수량은 바뀌지 않습니다. 물품 추가로 넣은 뒤 다시 완료하세요.`,
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
      <p className="text-sm leading-relaxed text-zinc-400">
        결제가 아니라 살 것·다 쓴 품목을 모아 두는 목록입니다. 사 온 뒤「구매
        완료」하면 재고 수량이 늘고, 이력에는 입고로 남습니다.
      </p>

      {!hasRows ? (
        <p className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-3 text-center text-sm text-zinc-500">
          목록이 비어 있어요. 아래에서 메모를 넣거나 재고 품목을 담아 보세요.
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
                    <p className="truncate text-[11px] text-zinc-500">
                      {formatItemCaption(it)} · {it.unit}
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500">{it.unit}</p>
                  )}
                </div>
                <label className="flex items-center gap-1 text-[11px] text-zinc-400">
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
                      <span className="ml-1.5 text-[10px] font-normal text-teal-400/90">
                        (카탈로그)
                      </span>
                    ) : (
                      <span className="ml-1.5 text-[10px] font-normal text-zinc-500">
                        (메모)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500">
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
                  <label className="flex items-center gap-1 text-[11px] text-zinc-400">
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
                  className={`${rowBtn} border border-zinc-600 text-zinc-400 hover:bg-zinc-800`}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="border-t border-zinc-800 pt-4">
        <p className="text-xs font-medium text-zinc-300">항목 추가</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label className="text-[10px] text-zinc-500">
              메모만 (장바구니 표시용)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={freeText}
                onChange={(ev) => setFreeText(ev.target.value)}
                placeholder="예: 우유, 빵"
                className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600"
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") {
                    ev.preventDefault();
                    addFreeText();
                  }
                }}
              />
              <button
                type="button"
                onClick={addFreeText}
                className="shrink-0 cursor-pointer rounded-lg border border-zinc-600 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
              >
                담기
              </button>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-sm">
            <label className="text-[10px] text-zinc-500">
              재고 품목에서 담기 (완료 시 수량 반영)
            </label>
            <div className="flex gap-2">
              <select
                value={pickItemId}
                onChange={(ev) => setPickItemId(ev.target.value)}
                className="min-w-0 flex-1 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
              >
                <option value="">품목 선택…</option>
                {pickCandidates.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                    {it.quantity > 0
                      ? ` (${it.quantity}${it.unit})`
                      : " (0)"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addFromInventory}
                className="shrink-0 cursor-pointer rounded-lg border border-teal-600/50 bg-teal-900/30 px-2.5 py-1.5 text-xs font-medium text-teal-200 hover:bg-teal-900/50"
              >
                담기
              </button>
            </div>
          </div>
        </div>
      </div>
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
        <p id={descId} className="mt-2 text-sm leading-relaxed text-zinc-400">
          칸·수량·유통기한 없이 목록에만 남깁니다. 나중에 헤더의「장보기」에서
          구매 완료하거나, 이어서「칸에 물품 추가」로 넣을 수 있습니다.
        </p>

        {resolved ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-teal-500/25 bg-teal-950/25 px-3 py-2.5">
              <p className="text-[11px] font-medium text-teal-200/90">
                담을 품목
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-100">
                {resolved.label}
              </p>
            </div>
            <div className="space-y-1">
              <label
                htmlFor={`shopping-quick-qty-${titleId}`}
                className="text-[11px] font-medium text-zinc-500"
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
            <p id={descId} className="mt-1 text-sm text-zinc-400">
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
            <p className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-6 text-center text-sm text-zinc-500">
              메인(대시보드)에서 거점을 선택한 상태로 다시 열어 주세요.
            </p>
          )}
        </div>
      </div>
    </MotionModalLayer>
  );
}
