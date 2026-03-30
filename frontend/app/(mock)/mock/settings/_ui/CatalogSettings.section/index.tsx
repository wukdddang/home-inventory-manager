"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { AppLoadingState } from "@/app/_ui/app-loading-state";
import { FormModal } from "@/app/_ui/form-modal";
import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import { useDashboard } from "../../../dashboard/_hooks/useDashboard";
import { CatalogModalsControls } from "@/app/(current)/dashboard/_ui/CatalogModals.controls";
import type {
  CatalogProduct,
  CatalogProductVariant,
  ProductCatalog,
} from "@/types/domain";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState, useMemo, useId, useRef, useEffect, useCallback } from "react";
import {
  ChevronDown,
  FolderTree,
  List,
  Package,
  PackagePlus,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";

/* ── helpers ── */

type EnrichedProduct = CatalogProduct & {
  categoryName: string;
  variants: (CatalogProductVariant & { unitSymbol: string })[];
};

function buildEnrichedProducts(catalog: ProductCatalog): EnrichedProduct[] {
  const catMap = new Map(catalog.categories.map((c) => [c.id, c.name]));
  const unitMap = new Map(catalog.units.map((u) => [u.id, u.symbol]));
  const varMap = new Map<
    string,
    (CatalogProductVariant & { unitSymbol: string })[]
  >();
  for (const v of catalog.variants) {
    const list = varMap.get(v.productId) ?? [];
    list.push({ ...v, unitSymbol: unitMap.get(v.unitId) ?? "" });
    varMap.set(v.productId, list);
  }
  return catalog.products.map((p) => ({
    ...p,
    categoryName: catMap.get(p.categoryId) ?? "",
    variants: varMap.get(p.id) ?? [],
  }));
}

function matchesQuery(product: EnrichedProduct, q: string): boolean {
  const lower = q.toLowerCase();
  if (product.name.toLowerCase().includes(lower)) return true;
  if (product.categoryName.toLowerCase().includes(lower)) return true;
  if (product.description?.toLowerCase().includes(lower)) return true;
  for (const v of product.variants) {
    const label = v.name || `${v.quantityPerUnit}${v.unitSymbol}`;
    if (label.toLowerCase().includes(lower)) return true;
  }
  return false;
}

/* ── 품목 수정 모달 ── */

type EditProductDraft = {
  id: string;
  name: string;
  description: string;
  isConsumable: boolean;
  categoryId: string;
};

function ProductEditModal({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  onSubmit,
  categories,
  zOffset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: EditProductDraft;
  onDraftChange: (d: EditProductDraft) => void;
  onSubmit: () => void;
  categories: ProductCatalog["categories"];
  zOffset?: number;
}) {
  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="품목 수정"
      onSubmit={onSubmit}
      submitLabel="저장"
      submitDisabled={!draft.name.trim()}
      zOffset={zOffset}
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="edit-prod-name"
            className="text-xs font-medium text-zinc-400"
          >
            품목명
          </label>
          <input
            id="edit-prod-name"
            type="text"
            value={draft.name}
            onChange={(e) => onDraftChange({ ...draft, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label
            htmlFor="edit-prod-category"
            className="text-xs font-medium text-zinc-400"
          >
            카테고리
          </label>
          <select
            id="edit-prod-category"
            value={draft.categoryId}
            onChange={(e) =>
              onDraftChange({ ...draft, categoryId: e.target.value })
            }
            className="mt-1 w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="edit-prod-desc"
            className="text-xs font-medium text-zinc-400"
          >
            설명 (선택)
          </label>
          <input
            id="edit-prod-desc"
            type="text"
            value={draft.description}
            onChange={(e) =>
              onDraftChange({ ...draft, description: e.target.value })
            }
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={draft.isConsumable}
            onChange={(e) =>
              onDraftChange({ ...draft, isConsumable: e.target.checked })
            }
            className="size-4 rounded border-zinc-600 bg-zinc-900"
          />
          소비재 (사용하면 수량이 줄어드는 품목)
        </label>
      </div>
    </FormModal>
  );
}

/* ── 카탈로그 목록 모달 본문 ── */

function CatalogListBody({
  catalog,
  onCatalogUpdate,
}: {
  catalog: ProductCatalog;
  onCatalogUpdate: (updater: (c: ProductCatalog) => ProductCatalog) => void;
}) {
  const [query, setQuery] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(
    () => new Set(catalog.categories.map((c) => c.id)),
  );
  const searchRef = useRef<HTMLInputElement>(null);

  /* 수정 모달 상태 */
  const [editDraft, setEditDraft] = useState<EditProductDraft | null>(null);

  /* 삭제 확인 상태 */
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "product" | "variant";
    id: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const categories = useMemo(
    () =>
      [...catalog.categories].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      ),
    [catalog.categories],
  );

  const allProducts = useMemo(() => buildEnrichedProducts(catalog), [catalog]);

  const filtered = useMemo(() => {
    let list = allProducts;
    if (filterCategoryId) {
      list = list.filter((p) => p.categoryId === filterCategoryId);
    }
    const q = query.trim();
    if (q) {
      list = list.filter((p) => matchesQuery(p, q));
    }
    return list;
  }, [allProducts, filterCategoryId, query]);

  const filteredByCategory = useMemo(() => {
    const map = new Map<string, EnrichedProduct[]>();
    for (const p of filtered) {
      const list = map.get(p.categoryId) ?? [];
      list.push(p);
      map.set(p.categoryId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    }
    return map;
  }, [filtered]);

  const visibleCategories = useMemo(
    () => categories.filter((c) => filteredByCategory.has(c.id)),
    [categories, filteredByCategory],
  );

  const isSearching = !!(query.trim() || filterCategoryId);

  const toggleCategory = (id: string) => {
    setOpenCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOpen = visibleCategories.every((c) => openCategoryIds.has(c.id));
  const toggleAll = () => {
    if (allOpen) {
      setOpenCategoryIds(new Set());
    } else {
      setOpenCategoryIds(new Set(visibleCategories.map((c) => c.id)));
    }
  };

  const handleStartEdit = useCallback((prod: EnrichedProduct) => {
    setEditDraft({
      id: prod.id,
      name: prod.name,
      description: prod.description ?? "",
      isConsumable: prod.isConsumable,
      categoryId: prod.categoryId,
    });
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editDraft || !editDraft.name.trim()) return;
    const d = editDraft;
    onCatalogUpdate((c) => ({
      ...c,
      products: c.products.map((p) =>
        p.id === d.id
          ? {
              ...p,
              name: d.name.trim(),
              description: d.description.trim() || undefined,
              isConsumable: d.isConsumable,
              categoryId: d.categoryId,
            }
          : p,
      ),
    }));
    toast({ title: "품목을 수정했습니다", description: d.name.trim() });
    setEditDraft(null);
  }, [editDraft, onCatalogUpdate]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    if (type === "product") {
      onCatalogUpdate((c) => ({
        ...c,
        products: c.products.filter((p) => p.id !== id),
        variants: c.variants.filter((v) => v.productId !== id),
      }));
    } else {
      onCatalogUpdate((c) => ({
        ...c,
        variants: c.variants.filter((v) => v.id !== id),
      }));
    }
    toast({
      title: type === "product" ? "품목을 삭제했습니다" : "용량·포장을 삭제했습니다",
      description: deleteTarget.label,
      variant: "destructive",
    });
    setDeleteTarget(null);
  }, [deleteTarget, onCatalogUpdate]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 고정: 검색 + 카테고리 필터 + 요약 */}
      <div className="shrink-0 space-y-3 border-b border-zinc-800 px-5 pb-4 pt-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="품목명, 카테고리, 용량 검색…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2.5 pl-9 pr-9 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-500 hover:text-zinc-300"
              aria-label="검색어 지우기"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilterCategoryId("")}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                !filterCategoryId
                  ? "border-teal-600/50 bg-teal-500/10 text-teal-300"
                  : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300",
              )}
            >
              전체
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setFilterCategoryId(filterCategoryId === cat.id ? "" : cat.id)
                }
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                  filterCategoryId === cat.id
                    ? "border-teal-600/50 bg-teal-500/10 text-teal-300"
                    : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300",
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {isSearching ? (
              <>
                검색 결과 {filtered.length}개 품목
                <span className="text-zinc-600">
                  {" "}
                  / 전체 {allProducts.length}개
                </span>
              </>
            ) : (
              <>
                카테고리 {catalog.categories.length}개 · 품목{" "}
                {catalog.products.length}개 · 용량·포장{" "}
                {catalog.variants.length}개
              </>
            )}
          </p>
          {visibleCategories.length > 1 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-zinc-500 transition hover:text-zinc-300"
            >
              {allOpen ? "모두 접기" : "모두 펼치기"}
            </button>
          )}
        </div>
      </div>

      {/* 스크롤: 목록 */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-5">
        {visibleCategories.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-zinc-500">
              {isSearching
                ? "검색 결과가 없습니다"
                : "등록된 카테고리가 없습니다"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleCategories.map((cat) => {
              const isOpen = openCategoryIds.has(cat.id);
              const products = filteredByCategory.get(cat.id) ?? [];

              return (
                <div
                  key={cat.id}
                  className="rounded-xl border border-zinc-800/70 bg-zinc-950/40"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-800/40"
                  >
                    <FolderTree className="size-4 shrink-0 text-teal-400/70" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-100">
                      {cat.name}
                    </span>
                    <span className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      {products.length}개
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-zinc-500 transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-zinc-800/50">
                      {products.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-zinc-600">
                          이 카테고리에 품목이 없습니다
                        </p>
                      ) : (
                        <div className="divide-y divide-zinc-800/40">
                          {products.map((prod) => (
                            <div key={prod.id} className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {prod.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={prod.imageUrl}
                                    alt=""
                                    className="size-9 shrink-0 rounded-lg border border-zinc-700 object-cover"
                                  />
                                ) : (
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                                    <Package className="size-4 text-zinc-600" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-zinc-200">
                                    {prod.name}
                                  </p>
                                  {prod.description && (
                                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                                      {prod.description}
                                    </p>
                                  )}
                                </div>
                                {!prod.isConsumable && (
                                  <span className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                                    비소비
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(prod)}
                                  className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-teal-300"
                                  aria-label={`${prod.name} 수정`}
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: "product",
                                      id: prod.id,
                                      label: prod.name,
                                    })
                                  }
                                  className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-rose-400"
                                  aria-label={`${prod.name} 삭제`}
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                              {prod.variants.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-2 pl-12">
                                  {prod.variants.map((v) => {
                                    const label =
                                      v.name ||
                                      `${v.quantityPerUnit}${v.unitSymbol}`;
                                    return (
                                      <span
                                        key={v.id}
                                        className="group inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-sm text-zinc-300"
                                      >
                                        <PackagePlus className="size-3.5 shrink-0 text-zinc-500" />
                                        {label}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDeleteTarget({
                                              type: "variant",
                                              id: v.id,
                                              label: `${prod.name} › ${label}`,
                                            })
                                          }
                                          className="ml-0.5 shrink-0 rounded p-0.5 text-zinc-600 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                                          aria-label={`${label} 변형 삭제`}
                                        >
                                          <X className="size-3" />
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 품목 수정 모달 */}
      <ProductEditModal
        open={editDraft !== null}
        onOpenChange={(v) => {
          if (!v) setEditDraft(null);
        }}
        draft={editDraft ?? { id: "", name: "", description: "", isConsumable: true, categoryId: "" }}
        onDraftChange={setEditDraft}
        onSubmit={handleSaveEdit}
        categories={catalog.categories}
        zOffset={10}
      />

      {/* 삭제 확인 모달 */}
      <AlertModal
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        title={
          deleteTarget?.type === "product" ? "품목 삭제" : "용량·포장 삭제"
        }
        description={
          deleteTarget
            ? deleteTarget.type === "product"
              ? `「${deleteTarget.label}」 품목과 연결된 모든 용량·포장을 삭제합니다.`
              : `「${deleteTarget.label}」 용량·포장을 삭제합니다.`
            : undefined
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        onConfirm={handleConfirmDelete}
        zOffset={10}
      />
    </div>
  );
}

/* ── 카탈로그 목록 모달 ── */

function CatalogListModal({
  open,
  onClose,
  catalog,
  onCatalogUpdate,
}: {
  open: boolean;
  onClose: () => void;
  catalog: ProductCatalog;
  onCatalogUpdate: (updater: (c: ProductCatalog) => ProductCatalog) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const titleId = `catalog-list-title-${uid}`;

  return (
    <MotionModalLayer
      open={open}
      onOpenChange={(v) => !v && onClose()}
      closeOnOverlayClick
      panelClassName="fixed left-1/2 top-1/2 z-10041 max-h-[min(100dvh-2rem,52rem)] w-[min(100vw-2rem,42rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
      ariaLabelledBy={titleId}
    >
      <div className="flex max-h-[min(100dvh-2rem,52rem)] flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300">
              <List className="size-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-white">
                카탈로그 목록
              </h2>
              <p className="mt-0.5 text-sm text-zinc-400">
                등록된 카테고리·품목·용량·포장 전체 목록
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="닫기"
          >
            <X className="size-4" />
          </button>
        </div>
        {/* body */}
        <CatalogListBody
          catalog={catalog}
          onCatalogUpdate={onCatalogUpdate}
        />
        {/* footer */}
        <div className="flex shrink-0 justify-end border-t border-zinc-800 p-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
          >
            닫기
          </button>
        </div>
      </div>
    </MotionModalLayer>
  );
}

/* ── 메인 섹션 ── */

const catalogInputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-[border-color,box-shadow] focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30";

export function CatalogSettingsSection() {
  const {
    households,
    householdKindDefinitions,
    거점_카탈로그를_가져온다,
    카탈로그를_갱신_한다,
    loading,
    error,
  } = useDashboard();
  const [pickedHouseholdId, setPickedHouseholdId] = useState<string | null>(
    null,
  );
  const [listOpen, setListOpen] = useState(false);

  const selectedId = useMemo(() => {
    if (households.length === 0) return null;
    if (
      pickedHouseholdId &&
      households.some((h) => h.id === pickedHouseholdId)
    ) {
      return pickedHouseholdId;
    }
    return households[0]!.id;
  }, [households, pickedHouseholdId]);

  const productCatalog = selectedId
    ? 거점_카탈로그를_가져온다(selectedId)
    : { units: [], categories: [], products: [], variants: [] };

  const onCatalogUpdate = useCallback(
    (updater: (c: ProductCatalog) => ProductCatalog) => {
      if (selectedId) 카탈로그를_갱신_한다(selectedId, updater);
    },
    [selectedId, 카탈로그를_갱신_한다],
  );

  if (error) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-base font-semibold text-white">상품 카탈로그</h2>
        <p className="mt-2 text-sm text-rose-400" role="alert">
          {error}
        </p>
      </section>
    );
  }

  if (loading && households.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-base font-semibold text-white">상품 카탈로그</h2>
        <AppLoadingState
          layout="embedded"
          message="카탈로그를 불러오는 중…"
          className="mt-2"
        />
      </section>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-base font-semibold text-white">상품 카탈로그</h2>
        <p className="mt-1 text-sm text-zinc-300">
          거점별로 카테고리·품목·용량·포장 목록을 관리합니다. 모달로 추가하고,
          메인「재고 추가」에서는 선택만 하면 됩니다.
        </p>

        {households.length > 1 && (
          <div className="mt-3">
            <select
              value={selectedId ?? ""}
              onChange={(e) => setPickedHouseholdId(e.target.value || null)}
              className={catalogInputClass}
            >
              {households.map((h) => {
                const kindDef = householdKindDefinitions.find(
                  (d) => d.id === h.kind,
                );
                return (
                  <option key={h.id} value={h.id}>
                    {h.name}
                    {kindDef ? ` (${kindDef.label})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <CatalogModalsControls
          catalog={productCatalog}
          onCatalogUpdate={onCatalogUpdate}
          layout="settings"
        />
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="mt-4 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-teal-300"
        >
          <List className="size-4" />
          <span>
            카테고리 {productCatalog.categories.length}개 · 품목{" "}
            {productCatalog.products.length}개 · 용량·포장{" "}
            {productCatalog.variants.length}개
          </span>
        </button>
      </section>

      <CatalogListModal
        open={listOpen}
        onClose={() => setListOpen(false)}
        catalog={productCatalog}
        onCatalogUpdate={onCatalogUpdate}
      />
    </>
  );
}
