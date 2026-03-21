"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CatalogModalsControls } from "@/app/(current)/dashboard/_ui/CatalogModals.controls";
import { useDashboard } from "../../_hooks/useDashboard";
import { newEntityId } from "../../_lib/dashboard-helpers";
import { toast } from "@/hooks/use-toast";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { cn } from "@/lib/utils";
import {
  listStorageOptionsForRoom,
  resolveRoomIdForStorageLocation,
} from "@/lib/household-location";
import { inventoryDisplayLine } from "@/lib/product-catalog-defaults";
import type { Household, InventoryRow } from "@/types/domain";

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

function StepShell({
  step,
  title,
  subtitle,
  children,
  listItemClassName,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** 임베드 2열 레이아웃 등 — `li`에 추가 클래스 */
  listItemClassName?: string;
}) {
  return (
    <li className={cn("flex gap-3 sm:gap-4", listItemClassName)}>
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

function CatalogHintLink() {
  const prefix = useAppRoutePrefix();
  return (
    <p className="text-[11px] leading-snug text-zinc-600">
      목록에 없으면 위쪽 카탈로그 추가 버튼·
      <Link
        href={`${prefix}/settings`}
        className="font-medium text-teal-400/90 underline-offset-2 hover:underline"
      >
        설정 → 상품 카탈로그
      </Link>
      에서 모달로 추가하세요.
    </p>
  );
}

/** 물품 추가 패널 헤더 — 제목 옆 인라인 안내 */
export function ItemAddPanelHeaderCatalogHint() {
  const prefix = useAppRoutePrefix();
  return (
    <span className="min-w-0 max-w-full text-[11px] leading-snug text-zinc-500">
      목록에 없으면 추가 버튼 또는{" "}
      <Link
        href={`${prefix}/settings`}
        className="font-medium whitespace-nowrap text-teal-400/90 underline-offset-2 hover:underline"
      >
        설정 → 상품 카탈로그
      </Link>
      에서 모달로 추가하세요.
    </span>
  );
}

/** 방 선택 후 — 보관 칸 → Category → Product → Variant → 수량 (카탈로그는 패널·상단·설정) */
export function RoomItemAddWidget({
  selected,
  roomId,
  embedInFloatingPanel = false,
}: RoomItemAddWidgetProps) {
  const {
    거점을_갱신_한다,
    productCatalog: catalog,
    카탈로그를_갱신_한다,
    catalogHydrated,
  } = useDashboard();

  const [pickedStorageId, setPickedStorageId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [stockQty, setStockQty] = useState("1");

  const room = selected.rooms.find((r) => r.id === roomId);

  const storageOptions = useMemo(
    () => listStorageOptionsForRoom(selected, roomId),
    [selected, roomId],
  );

  useEffect(() => {
    setPickedStorageId((cur) =>
      storageOptions.some((o) => o.id === cur)
        ? cur
        : (storageOptions[0]?.id ?? ""),
    );
  }, [storageOptions]);

  const categories = useMemo(
    () => (catalog ? sortByOrder(catalog.categories) : []),
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

    if (storageOptions.length === 0) {
      toast({
        title: "보관 칸이 없습니다",
        description:
          "왼쪽「가구 배치·보관 장소」에서 이 방에 보관 칸을 먼저 추가하세요.",
        variant: "warning",
      });
      return;
    }

    const slotId =
      pickedStorageId && storageOptions.some((o) => o.id === pickedStorageId)
        ? pickedStorageId
        : (storageOptions[0]?.id ?? "");
    if (!slotId) {
      toast({
        title: "보관 위치를 선택하세요",
        variant: "warning",
      });
      return;
    }

    const resolvedRoomId =
      resolveRoomIdForStorageLocation(selected, slotId) ?? roomId;

    const qty = Math.max(0, Number(stockQty) || 0);
    const variantCaption =
      variant.name ?? `${variant.quantityPerUnit}${unit.symbol}`;

    const row: InventoryRow = {
      id: newEntityId(),
      name: "",
      quantity: qty,
      unit: unit.symbol,
      roomId: resolvedRoomId,
      storageLocationId: slotId,
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
    const locLabel =
      storageOptions.find((o) => o.id === slotId)?.label ?? room.name;
    toast({
      title: "물품 추가됨",
      description: `${row.name} → ${locLabel}`,
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

  const steps12 = (
    <>
      <StepShell
        step={1}
        title="보관 위치"
        subtitle="이 방 안의 직속 칸 또는 가구 아래 칸을 고릅니다."
        listItemClassName={
          embedInFloatingPanel ? "break-inside-avoid pb-1" : undefined
        }
      >
        {storageOptions.length === 0 ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
            이 방에 등록된 보관 칸이 없습니다.「가구 배치·보관 장소」에서 방
            직속 칸 또는 가구·칸을 추가하세요.
          </p>
        ) : (
          <select
            aria-label="보관 칸 선택"
            value={
              storageOptions.some((o) => o.id === pickedStorageId)
                ? pickedStorageId
                : (storageOptions[0]?.id ?? "")
            }
            onChange={(e) => setPickedStorageId(e.target.value)}
            className={inputClass}
          >
            {storageOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </StepShell>

      <StepShell
        step={2}
        title="카테고리"
        subtitle="위에서 추가하거나 설정에 등록한 대분류 중에서 고릅니다."
        listItemClassName={
          embedInFloatingPanel ? "break-inside-avoid pb-1" : undefined
        }
      >
        {categories.length === 0 ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
            등록된 카테고리가 없습니다.
            {!embedInFloatingPanel ? <CatalogHintLink /> : null}
          </p>
        ) : (
          <>
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
            {!embedInFloatingPanel ? <CatalogHintLink /> : null}
          </>
        )}
      </StepShell>
    </>
  );

  const steps34 = (
    <>
      <StepShell
        step={3}
        title="품목"
        subtitle="선택한 카테고리 안의 품목을 고릅니다."
        listItemClassName={
          embedInFloatingPanel ? "break-inside-avoid pb-1" : undefined
        }
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
        {!embedInFloatingPanel ? <CatalogHintLink /> : null}
      </StepShell>

      <StepShell
        step={4}
        title="용량 · 포장 (Variant)"
        subtitle="등록된 단위·용량을 고릅니다."
        listItemClassName={
          embedInFloatingPanel ? "break-inside-avoid pb-1" : undefined
        }
      >
        <select
          aria-label="등록된 용량·포장 선택"
          value={variantIdResolved}
          onChange={(e) => setVariantId(e.target.value)}
          disabled={!productIdResolved || variantsInProduct.length === 0}
          className={`${inputClass} disabled:opacity-50`}
        >
          {variantsInProduct.length === 0 ? (
            <option value="">등록된 Variant 없음</option>
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
        {!embedInFloatingPanel ? <CatalogHintLink /> : null}
      </StepShell>
    </>
  );

  const footerQtyAndSubmit = (
    <>
      <div
        className={cn(
          "w-full space-y-1",
          embedInFloatingPanel ? "max-w-full" : "sm:max-w-48",
        )}
      >
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
        className={cn(
          "shrink-0 cursor-pointer rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-teal-500/15 transition hover:bg-teal-400 sm:px-6 sm:py-3",
          embedInFloatingPanel ? "w-full" : "w-full sm:w-auto",
        )}
      >
        선택한 칸에 물품 추가
      </button>
    </>
  );

  return (
    <div
      className={cn(
        "shrink-0",
        embedInFloatingPanel
          ? "rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-3 ring-1 ring-zinc-800/60 sm:p-4"
          : "rounded-2xl border border-teal-500/20 bg-linear-to-b from-teal-500/[0.07] to-zinc-950/40 p-4 ring-1 ring-teal-500/10 sm:p-5",
      )}
    >
      {!embedInFloatingPanel ? (
        <header className="border-b border-zinc-800/80 pb-4">
          <h2 className="text-base font-semibold tracking-tight text-teal-200">
            물품 등록 · {room.name}
          </h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-zinc-500">
            보관 칸을 고른 뒤 카탈로그에서 품목을 고릅니다. 아래 카탈로그 추가
            영역·설정에서 카테고리·품목·용량(Variant)을 모달로 추가할 수 있습니다.
          </p>
        </header>
      ) : (
        <p className="mb-3 text-[11px] leading-snug text-zinc-500">
          왼쪽·가운데: 보관·카테고리 / 품목·용량 — 오른쪽: 수량·추가.
        </p>
      )}

      {embedInFloatingPanel ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)] lg:gap-4">
          <div className="min-w-0 rounded-xl border border-zinc-800/55 bg-zinc-900/30 p-3 ring-1 ring-zinc-800/40 sm:p-4">
            <ol className="list-none space-y-4 p-0">{steps12}</ol>
          </div>
          <div className="min-w-0 rounded-xl border border-zinc-800/55 bg-zinc-900/30 p-3 ring-1 ring-zinc-800/40 sm:p-4">
            <ol className="list-none space-y-4 p-0">{steps34}</ol>
          </div>
          <div className="flex min-h-0 min-w-0 flex-col justify-end gap-4 rounded-xl border border-teal-500/25 bg-zinc-950/50 p-3 ring-1 ring-teal-500/10 sm:p-4">
            {footerQtyAndSubmit}
          </div>
        </div>
      ) : (
        <>
          {catalogHydrated ? (
            <div
              className="mb-4 rounded-xl border border-zinc-800/90 bg-zinc-900/35 p-3 ring-1 ring-zinc-800/50"
              role="region"
              aria-label="카탈로그 빠른 추가"
            >
              <p className="mb-2 text-[11px] font-medium text-zinc-500">
                카탈로그에 없으면 여기서 추가
              </p>
              <CatalogModalsControls
                catalog={catalog}
                onCatalogUpdate={카탈로그를_갱신_한다}
                layout="panel"
              />
            </div>
          ) : null}
          <ol className="mt-4 list-none space-y-5 p-0">
            {steps12}
            {steps34}
          </ol>
        </>
      )}

      {!embedInFloatingPanel ? (
        <footer
          className={cn(
            "mt-5 flex flex-col gap-4 rounded-xl border border-teal-500/25 bg-zinc-950/50 p-4 ring-1 ring-teal-500/10 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
          )}
        >
          {footerQtyAndSubmit}
        </footer>
      ) : null}
    </div>
  );
}
