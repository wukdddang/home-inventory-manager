"use client";

import type {
  CatalogProduct,
  CatalogProductVariant,
  ProductCatalog,
} from "@/types/domain";
import { ChevronDown, ChevronRight, FolderTree, Layers, Package, PackagePlus, Search, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import { CatalogModalNav, sortByOrder, type CatalogModalId } from "./shared";

export function CatalogBrowserModal({
  onClose,
  catalog,
  onNavigate,
  disabledNavIds,
}: {
  onClose: () => void;
  catalog: ProductCatalog;
  onNavigate: (id: CatalogModalId) => void;
  disabledNavIds?: Set<CatalogModalId>;
}) {
  const uid = useId().replace(/:/g, "");
  const titleId = `catalog-browser-title-${uid}`;

  const [query, setQuery] = useState("");
  const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(
    () => new Set(catalog.categories.map((c) => c.id)),
  );
  const [openProductIds, setOpenProductIds] = useState<Set<string>>(() => new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  const categories = useMemo(() => sortByOrder(catalog.categories), [catalog.categories]);
  const unitMap = useMemo(() => new Map(catalog.units.map((u) => [u.id, u])), [catalog.units]);

  const productsByCategory = useMemo(() => {
    const map = new Map<string, CatalogProduct[]>();
    for (const p of catalog.products) {
      const list = map.get(p.categoryId) ?? [];
      list.push(p);
      map.set(p.categoryId, list);
    }
    return map;
  }, [catalog.products]);

  const variantsByProduct = useMemo(() => {
    const map = new Map<string, CatalogProductVariant[]>();
    for (const v of catalog.variants) {
      const list = map.get(v.productId) ?? [];
      list.push(v);
      map.set(v.productId, list);
    }
    return map;
  }, [catalog.variants]);

  /* 검색 필터 */
  const isSearching = query.trim().length > 0;
  const q = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!isSearching) return categories;
    return categories.filter((cat) => {
      if (cat.name.toLowerCase().includes(q)) return true;
      const prods = productsByCategory.get(cat.id) ?? [];
      return prods.some((p) => {
        if (p.name.toLowerCase().includes(q)) return true;
        if (p.description?.toLowerCase().includes(q)) return true;
        const vars = variantsByProduct.get(p.id) ?? [];
        return vars.some((v) => {
          const unit = unitMap.get(v.unitId);
          const label = v.name || `${v.quantityPerUnit}${unit?.symbol ?? ""}`;
          return label.toLowerCase().includes(q);
        });
      });
    });
  }, [categories, isSearching, q, productsByCategory, variantsByProduct, unitMap]);

  /* 검색 시 매칭 품목 필터 */
  const matchesProduct = useCallback(
    (p: CatalogProduct) => {
      if (!isSearching) return true;
      if (p.name.toLowerCase().includes(q)) return true;
      if (p.description?.toLowerCase().includes(q)) return true;
      const vars = variantsByProduct.get(p.id) ?? [];
      return vars.some((v) => {
        const unit = unitMap.get(v.unitId);
        const label = v.name || `${v.quantityPerUnit}${unit?.symbol ?? ""}`;
        return label.toLowerCase().includes(q);
      });
    },
    [isSearching, q, variantsByProduct, unitMap],
  );

  /* 검색 시 카테고리 이름 자체가 매칭되면 하위 전부 표시 */
  const catNameMatches = useCallback(
    (catName: string) => isSearching && catName.toLowerCase().includes(q),
    [isSearching, q],
  );

  // 검색 시 열림 상태를 렌더 중 계산 (useEffect 대신 useMemo)
  const effectiveOpenCategoryIds = useMemo(() => {
    if (!isSearching) return openCategoryIds;
    return new Set(filteredCategories.map((c) => c.id));
  }, [isSearching, openCategoryIds, filteredCategories]);

  const effectiveOpenProductIds = useMemo(() => {
    if (!isSearching) return openProductIds;
    const prodIds = new Set<string>();
    for (const cat of filteredCategories) {
      const prods = productsByCategory.get(cat.id) ?? [];
      for (const p of prods) {
        if (catNameMatches(cat.name) || matchesProduct(p)) {
          if ((variantsByProduct.get(p.id) ?? []).length > 0) prodIds.add(p.id);
        }
      }
    }
    return prodIds;
  }, [isSearching, openProductIds, filteredCategories, productsByCategory, variantsByProduct, catNameMatches, matchesProduct]);

  const toggleCategory = (id: string) => {
    setOpenCategoryIds((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const toggleProduct = (id: string) => {
    setOpenProductIds((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const allCatOpen = filteredCategories.length > 0 && filteredCategories.every((c) => effectiveOpenCategoryIds.has(c.id));
  const toggleAllCat = () => {
    if (allCatOpen) { setOpenCategoryIds(new Set()); setOpenProductIds(new Set()); }
    else setOpenCategoryIds(new Set(filteredCategories.map((c) => c.id)));
  };

  const totalProducts = catalog.products.length;
  const totalVariants = catalog.variants.length;

  return (
    <MotionModalLayer
      open
      onOpenChange={(v) => !v && onClose()}
      closeOnOverlayClick
      panelClassName="fixed left-1/2 top-1/2 z-10041 max-h-[min(100dvh-2rem,56rem)] w-[min(100vw-2rem,48rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
      ariaLabelledBy={titleId}
    >
      <div className="flex max-h-[min(100dvh-2rem,56rem)] flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300">
              <Layers className="size-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-white">카탈로그 관리</h2>
              <p className="mt-0.5 text-sm text-zinc-400">
                카테고리 {categories.length}개 · 품목 {totalProducts}개 · 용량·포장 {totalVariants}개
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200" aria-label="닫기">
            <X className="size-4" />
          </button>
        </div>

        {/* 검색 */}
        <div className="shrink-0 px-5 pb-3 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="카테고리, 품목, 용량·포장 검색…"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2.5 pl-9 pr-9 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-500 hover:text-zinc-300" aria-label="검색어 지우기">
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 구분선 + 모두 접기 */}
        {filteredCategories.length > 1 ? (
          <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-5 py-2">
            <div className="flex-1 border-t border-zinc-800" />
            <button type="button" onClick={toggleAllCat} className="shrink-0 text-xs text-zinc-500 transition hover:text-zinc-300">
              {allCatOpen ? "모두 접기" : "모두 펼치기"}
            </button>
          </div>
        ) : (
          <div className="border-b border-zinc-800" />
        )}

        {/* 트리 본문 */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-5">
          {filteredCategories.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-zinc-500">{isSearching ? "검색 결과가 없습니다" : "등록된 카테고리가 없습니다"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCategories.map((cat) => {
                const isCatOpen = effectiveOpenCategoryIds.has(cat.id);
                const allProds = productsByCategory.get(cat.id) ?? [];
                const prods = isSearching && !catNameMatches(cat.name) ? allProds.filter(matchesProduct) : allProds;
                const varCount = allProds.reduce((sum, p) => sum + (variantsByProduct.get(p.id) ?? []).length, 0);
                return (
                  <div key={cat.id} className="rounded-xl border border-zinc-800/70 bg-zinc-950/40">
                    {/* 카테고리 헤더 */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-800/40"
                    >
                      <FolderTree className="size-4 shrink-0 text-teal-400/70" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-100">{cat.name}</span>
                      <span className="shrink-0 text-xs text-zinc-500">{prods.length}개 품목 · {varCount}개 포장</span>
                      <ChevronDown className={cn("size-4 shrink-0 text-zinc-500 transition-transform", isCatOpen && "rotate-180")} />
                    </button>

                    {isCatOpen && (
                      <div className="border-t border-zinc-800/50">
                        {prods.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-zinc-600">이 카테고리에 품목이 없습니다</p>
                        ) : (
                          <div className="divide-y divide-zinc-800/40">
                            {prods.map((prod) => {
                              const variants = variantsByProduct.get(prod.id) ?? [];
                              const isProdOpen = effectiveOpenProductIds.has(prod.id);
                              return (
                                <div key={prod.id}>
                                  {/* 품목 행 */}
                                  <div
                                    className={cn(
                                      "flex items-center gap-3 px-4 py-2.5 transition",
                                      variants.length > 0 ? "cursor-pointer hover:bg-zinc-800/30" : "",
                                    )}
                                    onClick={() => variants.length > 0 && toggleProduct(prod.id)}
                                  >
                                    {prod.imageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={prod.imageUrl} alt="" className="size-8 shrink-0 rounded-lg border border-zinc-700 object-cover" />
                                    ) : (
                                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                                        <Package className="size-3.5 text-zinc-600" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium text-zinc-200">{prod.name}</p>
                                      {prod.description && <p className="mt-0.5 truncate text-xs text-zinc-500">{prod.description}</p>}
                                    </div>
                                    {!prod.isConsumable && (
                                      <span className="shrink-0 rounded-md bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">비소비</span>
                                    )}
                                    {variants.length > 0 ? (
                                      <div className="flex shrink-0 items-center gap-1 text-xs text-zinc-500">
                                        <span>{variants.length}개</span>
                                        <ChevronRight className={cn("size-3.5 transition-transform", isProdOpen && "rotate-90")} />
                                      </div>
                                    ) : (
                                      <span className="shrink-0 text-xs text-zinc-600">포장 없음</span>
                                    )}
                                  </div>

                                  {/* 용량·포장 하위 목록 */}
                                  {isProdOpen && variants.length > 0 && (
                                    <div className="border-t border-zinc-800/30 bg-zinc-950/60 px-4 py-2">
                                      <div className="space-y-1 pl-11">
                                        {variants.map((v) => {
                                          const unit = unitMap.get(v.unitId);
                                          const label = v.name || `${v.quantityPerUnit}${unit?.symbol ?? ""}`;
                                          return (
                                            <div key={v.id} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition hover:bg-zinc-800/40">
                                              <PackagePlus className="size-3.5 shrink-0 text-zinc-500" />
                                              <span className="text-zinc-300">{label}</span>
                                              {unit && (
                                                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">{unit.symbol}{unit.name ? ` (${unit.name})` : ""}</span>
                                              )}
                                              {v.price != null && (
                                                <span className="text-xs text-zinc-500">{v.price.toLocaleString()}원</span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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

        {/* footer */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-zinc-800 p-4">
          <CatalogModalNav current="browser" onNavigate={onNavigate} disabledIds={disabledNavIds} />
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400">
              닫기
            </button>
          </div>
        </div>
      </div>
    </MotionModalLayer>
  );
}
