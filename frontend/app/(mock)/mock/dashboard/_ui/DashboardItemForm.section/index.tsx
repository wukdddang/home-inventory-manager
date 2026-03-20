"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { newEntityId } from "../../_lib/dashboard-helpers";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { inventoryDisplayLine } from "@/lib/product-catalog-defaults";
import type {
  CatalogProduct,
  CatalogProductVariant,
  Household,
  InventoryRow,
  ProductCatalog,
} from "@/types/domain";

export type RoomItemAddWidgetProps = {
  selected: Household;
  roomId: string;
  /** 고정 패널 안에 넣을 때 상단 제목 블록 생략 */
  embedInFloatingPanel?: boolean;
};

function sortByOrder<T extends { sortOrder?: number }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || 0,
  );
}

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-[border-color,box-shadow] focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30";

const btnGhost =
  "cursor-pointer rounded-xl border border-zinc-600 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40";

function StepShell({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3 sm:gap-4">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-sm font-bold tabular-nums text-teal-300 ring-1 ring-teal-500/20"
        aria-hidden
      >
        {step}
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </div>
    </li>
  );
}

function CatalogExpandBox({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3 ring-1 ring-zinc-800/50">
      <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      {children}
    </div>
  );
}

/** 방 선택 후 — Category → Product → ProductVariant → 보유 수량 */
export function RoomItemAddWidget({
  selected,
  roomId,
  embedInFloatingPanel = false,
}: RoomItemAddWidgetProps) {
  const { 거점을_갱신_한다 } = useDashboard();
  const catalog = selected.catalog;

  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [stockQty, setStockQty] = useState("1");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductConsumable, setNewProductConsumable] = useState(true);
  const [newVariantUnitId, setNewVariantUnitId] = useState("");
  const [newVariantQtyPer, setNewVariantQtyPer] = useState("500");
  const [newVariantLabel, setNewVariantLabel] = useState("");

  const room = selected.rooms.find((r) => r.id === roomId);

  const categories = useMemo(
    () => (catalog ? sortByOrder(catalog.categories) : []),
    [catalog],
  );
  const units = useMemo(
    () => (catalog ? sortByOrder(catalog.units) : []),
    [catalog],
  );

  const categoryIdResolved = useMemo(() => {
    if (categoryId && categories.some((c) => c.id === categoryId)) {
      return categoryId;
    }
    return categories[0]?.id ?? "";
  }, [categories, categoryId]);

  const productsInCategory = useMemo(() => {
    if (!catalog || !categoryIdResolved) return [];
    return [
      ...catalog.products.filter((p) => p.categoryId === categoryIdResolved),
    ].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [catalog, categoryIdResolved]);

  const productIdResolved = useMemo(() => {
    if (productId && productsInCategory.some((p) => p.id === productId)) {
      return productId;
    }
    return productsInCategory[0]?.id ?? "";
  }, [productId, productsInCategory]);

  const variantsInProduct = useMemo(() => {
    if (!catalog || !productIdResolved) return [];
    return catalog.variants.filter((v) => v.productId === productIdResolved);
  }, [catalog, productIdResolved]);

  const variantIdResolved = useMemo(() => {
    if (variantId && variantsInProduct.some((v) => v.id === variantId)) {
      return variantId;
    }
    const def =
      variantsInProduct.find((v) => v.isDefault) ?? variantsInProduct[0];
    return def?.id ?? "";
  }, [variantId, variantsInProduct]);

  const newVariantUnitIdResolved = useMemo(() => {
    if (
      newVariantUnitId &&
      units.some((u) => u.id === newVariantUnitId)
    ) {
      return newVariantUnitId;
    }
    return units[0]?.id ?? "";
  }, [newVariantUnitId, units]);

  const updateCatalog = useCallback(
    (fn: (c: ProductCatalog) => ProductCatalog) => {
      거점을_갱신_한다(selected.id, (h) => {
        if (!h.catalog) return h;
        return { ...h, catalog: fn(h.catalog) };
      });
    },
    [거점을_갱신_한다, selected.id],
  );

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name || !catalog) return;
    const id = newEntityId();
    const nextSort =
      Math.max(0, ...catalog.categories.map((c) => c.sortOrder ?? 0)) + 1;
    updateCatalog((c) => ({
      ...c,
      categories: [...c.categories, { id, name, sortOrder: nextSort }],
    }));
    setCategoryId(id);
    setNewCategoryName("");
    toast({ title: "카테고리 추가됨", description: name });
  };

  const handleAddProduct = () => {
    const name = newProductName.trim();
    if (!name || !catalog || !categoryIdResolved) return;
    const id = newEntityId();
    const p: CatalogProduct = {
      id,
      categoryId: categoryIdResolved,
      name,
      isConsumable: newProductConsumable,
    };
    updateCatalog((c) => ({
      ...c,
      products: [...c.products, p],
    }));
    setProductId(id);
    setNewProductName("");
    toast({ title: "품목 추가됨", description: name });
  };

  const handleAddVariant = () => {
    if (!catalog || !productIdResolved || !newVariantUnitIdResolved) return;
    const q = Number(newVariantQtyPer);
    if (!Number.isFinite(q) || q <= 0) {
      toast({
        title: "용량/수량을 확인하세요",
        description: "quantityPerUnit은 0보다 큰 숫자여야 합니다.",
        variant: "warning",
      });
      return;
    }
    const id = newEntityId();
    const unit = catalog.units.find((u) => u.id === newVariantUnitIdResolved);
    const label =
      newVariantLabel.trim() ||
      (unit ? `${q}${unit.symbol}` : String(q));
    const v: CatalogProductVariant = {
      id,
      productId: productIdResolved,
      unitId: newVariantUnitIdResolved,
      quantityPerUnit: q,
      name: label,
      isDefault: variantsInProduct.length === 0,
    };
    updateCatalog((c) => ({
      ...c,
      variants: [...c.variants, v],
    }));
    setVariantId(id);
    setNewVariantLabel("");
    setNewVariantQtyPer("500");
    toast({ title: "용량·포장 단위 추가됨", description: label });
  };

  const handleAddItem = () => {
    if (!room || !catalog) return;
    const variant = catalog.variants.find((v) => v.id === variantIdResolved);
    const product = catalog.products.find((p) => p.id === productIdResolved);
    const category = catalog.categories.find(
      (c) => c.id === categoryIdResolved,
    );
    const unit = variant
      ? catalog.units.find((u) => u.id === variant.unitId)
      : undefined;

    if (!variant || !product || !category || !unit) {
      toast({
        title: "선택을 완료해 주세요",
        description: "카테고리·품목·용량(Variant)을 모두 선택하세요.",
        variant: "warning",
      });
      return;
    }

    const qty = Math.max(0, Number(stockQty) || 0);
    const variantCaption =
      variant.name ?? `${variant.quantityPerUnit}${unit.symbol}`;

    const row: InventoryRow = {
      id: newEntityId(),
      name: "",
      quantity: qty,
      unit: unit.symbol,
      roomId,
      categoryId: category.id,
      productId: product.id,
      productVariantId: variant.id,
      variantCaption,
      quantityPerUnit: variant.quantityPerUnit,
    };
    row.name = inventoryDisplayLine(catalog, row);

    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      items: [...h.items, row],
    }));
    setStockQty("1");
    toast({
      title: "물품 추가됨",
      description: `${row.name} → ${room.name}`,
      variant: "success",
    });
  };

  if (!room) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
        선택한 방을 찾을 수 없습니다. 목록을 확인해 주세요.
      </p>
    );
  }

  if (!catalog) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
        카탈로그 데이터가 없습니다. 페이지를 새로고침하거나 거점을 다시 만들어
        주세요.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "shrink-0",
        embedInFloatingPanel
          ? "rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-3 ring-1 ring-zinc-800/60"
          : "rounded-2xl border border-teal-500/20 bg-linear-to-b from-teal-500/[0.07] to-zinc-950/40 p-4 ring-1 ring-teal-500/10 sm:p-5",
      )}
    >
      {!embedInFloatingPanel ? (
        <header className="border-b border-zinc-800/80 pb-4">
          <h2 className="text-base font-semibold tracking-tight text-teal-200">
            물품 등록 · {room.name}
          </h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-zinc-500">
            카테고리 → 품목 → 용량·포장(Variant) 순으로 고른 뒤, 이 방에 재고를
            넣습니다.
          </p>
        </header>
      ) : (
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
          카테고리 → 품목 → 용량·포장(Variant) 순으로 고른 뒤 재고를 넣습니다.
        </p>
      )}

      <ol
        className={cn(
          "list-none space-y-6 p-0",
          embedInFloatingPanel ? "mt-0" : "mt-4",
        )}
      >
        <StepShell
          step={1}
          title="카테고리"
          subtitle="대분류를 고르거나 새로 만듭니다."
        >
          <select
            aria-label="카테고리 선택"
            value={categoryIdResolved}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setProductId("");
              setVariantId("");
            }}
            className={inputClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <CatalogExpandBox label="카탈로그에 카테고리 추가">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="이름 (예: 식료품)"
                className={`${inputClass} sm:min-w-0 sm:flex-1`}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className={`${btnGhost} sm:w-28`}
              >
                추가
              </button>
            </div>
          </CatalogExpandBox>
        </StepShell>

        <StepShell
          step={2}
          title="품목"
          subtitle="카테고리 안의 품목을 고르거나 새로 등록합니다."
        >
          <select
            aria-label="품목 선택"
            value={productIdResolved}
            onChange={(e) => {
              setProductId(e.target.value);
              setVariantId("");
            }}
            disabled={!categoryIdResolved || productsInCategory.length === 0}
            className={`${inputClass} disabled:opacity-50`}
          >
            {productsInCategory.length === 0 ? (
              <option value="">이 카테고리에 품목이 없습니다</option>
            ) : (
              productsInCategory.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.isConsumable ? "" : " (비소모)"}
                </option>
              ))
            )}
          </select>
          <CatalogExpandBox label="카탈로그에 품목 추가">
            <div className="flex flex-col gap-3">
              <input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="품목명 (예: 라면)"
                className={inputClass}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={newProductConsumable}
                    onChange={(e) => setNewProductConsumable(e.target.checked)}
                    className="rounded border-zinc-600"
                  />
                  소비형 품목
                </label>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!categoryIdResolved}
                  className={`${btnGhost} w-full sm:w-auto sm:shrink-0`}
                >
                  품목 추가
                </button>
              </div>
            </div>
          </CatalogExpandBox>
        </StepShell>

        <StepShell
          step={3}
          title="용량 · 포장 (Variant)"
          subtitle="기존 단위를 고르거나, 단위·수량으로 새 Variant를 만듭니다."
        >
          <select
            aria-label="등록된 용량·포장 선택"
            value={variantIdResolved}
            onChange={(e) => setVariantId(e.target.value)}
            disabled={!productIdResolved || variantsInProduct.length === 0}
            className={`${inputClass} disabled:opacity-50`}
          >
            {variantsInProduct.length === 0 ? (
              <option value="">등록된 Variant 없음 — 아래에서 추가</option>
            ) : (
              variantsInProduct.map((v) => {
                const u = catalog.units.find((x) => x.id === v.unitId);
                const label =
                  v.name ?? `${v.quantityPerUnit}${u?.symbol ?? ""}`;
                return (
                  <option key={v.id} value={v.id}>
                    {label}
                  </option>
                );
              })
            )}
          </select>
          <p className="text-[11px] leading-snug text-zinc-600">
            예: 500ml → 단위 <span className="text-zinc-500">ml</span>, 수량{" "}
            <span className="text-zinc-500">500</span> · 5개입 팩 → 단위{" "}
            <span className="text-zinc-500">팩</span>, 수량{" "}
            <span className="text-zinc-500">5</span>
          </p>
          <CatalogExpandBox label="새 용량·포장 단위">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-500">
                  단위
                </label>
                <select
                  value={newVariantUnitIdResolved}
                  onChange={(e) => setNewVariantUnitId(e.target.value)}
                  className={inputClass}
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.symbol}
                      {u.name ? ` (${u.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-500">
                  용량 / 개수 (한 단위당)
                </label>
                <input
                  type="number"
                  min={0.01}
                  step="any"
                  value={newVariantQtyPer}
                  onChange={(e) => setNewVariantQtyPer(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-medium text-zinc-500">
                  표시 이름 (선택)
                </label>
                <input
                  value={newVariantLabel}
                  onChange={(e) => setNewVariantLabel(e.target.value)}
                  placeholder="비우면 단위·수량으로 자동 생성"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddVariant}
                  disabled={!productIdResolved}
                  className={`${btnGhost} w-full`}
                >
                  Variant 추가
                </button>
              </div>
            </div>
          </CatalogExpandBox>
        </StepShell>
      </ol>

      <footer className="mt-6 flex flex-col gap-4 rounded-xl border border-teal-500/25 bg-zinc-950/50 p-4 ring-1 ring-teal-500/10 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="w-full space-y-1 sm:max-w-48">
          <label
            htmlFor={`stock-qty-${roomId}`}
            className="text-[11px] font-medium text-zinc-500"
          >
            보유 수량 (선택한 Variant 기준)
          </label>
          <input
            id={`stock-qty-${roomId}`}
            type="number"
            min={0}
            value={stockQty}
            onChange={(e) => setStockQty(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          className="w-full shrink-0 cursor-pointer rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-teal-500/15 transition hover:bg-teal-400 sm:w-auto"
        >
          이 방에 물품 추가
        </button>
      </footer>
    </div>
  );
}
