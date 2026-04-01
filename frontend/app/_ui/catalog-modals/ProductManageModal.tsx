"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { FormModal } from "@/app/_ui/form-modal";
import { newEntityId } from "@/app/(mock)/mock/dashboard/_lib/dashboard-helpers";
import { MAX_CATALOG_IMAGE_BYTES, readImageFileAsDataUrl } from "@/lib/image-upload";
import { toast } from "@/hooks/use-toast";
import type {
  CatalogProduct,
  CatalogProductVariant,
  ProductCatalog,
} from "@/types/domain";
import { ChevronDown, FolderTree, Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import { CatalogModalFormBody, CatalogModalNav, inputClass, sortByOrder, type CatalogModalId } from "./shared";

type EnrichedListProduct = CatalogProduct & {
  categoryName: string;
  variants: (CatalogProductVariant & { unitSymbol: string })[];
};

function buildListProducts(catalog: ProductCatalog): EnrichedListProduct[] {
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

type EditProductDraft = {
  id: string;
  name: string;
  description: string;
  isConsumable: boolean;
  categoryId: string;
};

export function ProductManageModal({
  onClose,
  catalog,
  onCatalogUpdate,
  onNavigate,
}: {
  onClose: () => void;
  catalog: ProductCatalog;
  onCatalogUpdate: (fn: (c: ProductCatalog) => ProductCatalog) => void;
  onNavigate: (id: CatalogModalId) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const titleId = `prod-manage-title-${uid}`;

  /* ── 목록 상태 ── */
  const [query, setQuery] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(
    () => new Set(catalog.categories.map((c) => c.id)),
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const [editDraft, setEditDraft] = useState<EditProductDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "product";
    id: string;
    label: string;
  } | null>(null);

  /* ── 추가 상태 ── */
  const [addOpen, setAddOpen] = useState(false);
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodConsumable, setProdConsumable] = useState(true);
  const [prodDescription, setProdDescription] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState<string | null>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const categories = useMemo(
    () => sortByOrder(catalog.categories),
    [catalog.categories],
  );

  const allProducts = useMemo(() => buildListProducts(catalog), [catalog]);

  const filtered = useMemo(() => {
    let list = allProducts;
    if (filterCategoryId) list = list.filter((p) => p.categoryId === filterCategoryId);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        if (p.name.toLowerCase().includes(q)) return true;
        if (p.categoryName.toLowerCase().includes(q)) return true;
        if (p.description?.toLowerCase().includes(q)) return true;
        for (const v of p.variants) {
          const label = v.name || `${v.quantityPerUnit}${v.unitSymbol}`;
          if (label.toLowerCase().includes(q)) return true;
        }
        return false;
      });
    }
    return list;
  }, [allProducts, filterCategoryId, query]);

  const filteredByCategory = useMemo(() => {
    const map = new Map<string, EnrichedListProduct[]>();
    for (const p of filtered) {
      const list = map.get(p.categoryId) ?? [];
      list.push(p);
      map.set(p.categoryId, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
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
    if (allOpen) setOpenCategoryIds(new Set());
    else setOpenCategoryIds(new Set(visibleCategories.map((c) => c.id)));
  };

  /* ── 수정 ── */
  const handleStartEdit = useCallback((prod: EnrichedListProduct) => {
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
    setEditDraft(null);
    toast({ title: "품목 수정됨", description: d.name.trim() });
  }, [editDraft, onCatalogUpdate]);

  /* ── 삭제 ── */
  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    onCatalogUpdate((c) => ({
      ...c,
      products: c.products.filter((p) => p.id !== id),
      variants: c.variants.filter((v) => v.productId !== id),
    }));
    setDeleteTarget(null);
    toast({ title: "품목 삭제됨", description: deleteTarget.label });
  }, [deleteTarget, onCatalogUpdate]);

  /* ── 추가 ── */
  const categoryIdForProd = useMemo(() => {
    if (prodCategoryId && categories.some((c) => c.id === prodCategoryId)) return prodCategoryId;
    return categories[0]?.id ?? "";
  }, [categories, prodCategoryId]);

  const handleOpenAdd = () => {
    setProdCategoryId(categories[0]?.id ?? "");
    setProdName("");
    setProdDescription("");
    setProdImageUrl(null);
    setProdConsumable(true);
    setAddOpen(true);
  };

  const handleSubmitProduct = () => {
    const name = prodName.trim();
    if (!name || !categoryIdForProd) {
      toast({ title: "입력을 확인하세요", description: "카테고리와 품목명을 채워 주세요.", variant: "warning" });
      return;
    }
    const id = newEntityId();
    const desc = prodDescription.trim();
    const p: CatalogProduct = {
      id,
      categoryId: categoryIdForProd,
      name,
      isConsumable: prodConsumable,
      ...(desc ? { description: desc } : {}),
      ...(prodImageUrl ? { imageUrl: prodImageUrl } : {}),
    };
    onCatalogUpdate((c) => ({ ...c, products: [...c.products, p] }));
    setProdName("");
    setProdDescription("");
    setProdImageUrl(null);
    setAddOpen(false);
    toast({ title: "품목 추가됨", description: name });
  };

  return (
    <MotionModalLayer
      open
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
              <Package className="size-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-white">
                품목 관리
              </h2>
              <p className="mt-0.5 text-sm text-zinc-400">
                품목을 조회·추가·수정·삭제합니다
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              disabled={categories.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 disabled:opacity-40"
            >
              <Plus className="size-3.5" />
              추가
            </button>
            <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200" aria-label="닫기">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* 검색 + 카테고리 필터 */}
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
                <button type="button" onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-500 hover:text-zinc-300" aria-label="검색어 지우기">
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
                    onClick={() => setFilterCategoryId(filterCategoryId === cat.id ? "" : cat.id)}
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
                  <>검색 결과 {filtered.length}개 품목<span className="text-zinc-600"> / 전체 {allProducts.length}개</span></>
                ) : (
                  <>카테고리 {catalog.categories.length}개 · 품목 {catalog.products.length}개 · 용량·포장 {catalog.variants.length}개</>
                )}
              </p>
              {visibleCategories.length > 1 && (
                <button type="button" onClick={toggleAll} className="text-xs text-zinc-500 transition hover:text-zinc-300">
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
                  {isSearching ? "검색 결과가 없습니다" : "등록된 품목이 없습니다"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleCategories.map((cat) => {
                  const isOpen = openCategoryIds.has(cat.id);
                  const products = filteredByCategory.get(cat.id) ?? [];
                  return (
                    <div key={cat.id} className="rounded-xl border border-zinc-800/70 bg-zinc-950/40">
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
                        <ChevronDown className={cn("size-4 shrink-0 text-zinc-500 transition-transform", isOpen && "rotate-180")} />
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
                                      <img src={prod.imageUrl} alt="" className="size-9 shrink-0 rounded-lg border border-zinc-700 object-cover" />
                                    ) : (
                                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                                        <Package className="size-4 text-zinc-600" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium text-zinc-200">{prod.name}</p>
                                      {prod.description && <p className="mt-0.5 truncate text-xs text-zinc-500">{prod.description}</p>}
                                    </div>
                                    {!prod.isConsumable && (
                                      <span className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">비소비</span>
                                    )}
                                    <button type="button" onClick={() => handleStartEdit(prod)} className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-teal-300" aria-label={`${prod.name} 수정`}>
                                      <Pencil className="size-3.5" />
                                    </button>
                                    <button type="button" onClick={() => setDeleteTarget({ type: "product", id: prod.id, label: prod.name })} className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-rose-400" aria-label={`${prod.name} 삭제`}>
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
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
        </div>

        {/* footer */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-zinc-800 p-4">
          <CatalogModalNav current="product" onNavigate={onNavigate} />
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400">
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* 품목 수정 모달 */}
      <FormModal
        open={editDraft !== null}
        onOpenChange={(v) => { if (!v) setEditDraft(null); }}
        title="품목 수정"
        onSubmit={handleSaveEdit}
        submitLabel="저장"
        submitDisabled={!editDraft?.name.trim()}
        zOffset={10}
      >
        {editDraft && (
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-prod-name" className="text-xs font-medium text-zinc-400">품목명</label>
              <input id="edit-prod-name" type="text" value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
            </div>
            <div>
              <label htmlFor="edit-prod-category" className="text-xs font-medium text-zinc-400">카테고리</label>
              <select id="edit-prod-category" value={editDraft.categoryId} onChange={(e) => setEditDraft({ ...editDraft, categoryId: e.target.value })} className="mt-1 w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500">
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-prod-desc" className="text-xs font-medium text-zinc-400">설명 (선택)</label>
              <input id="edit-prod-desc" type="text" value={editDraft.description} onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={editDraft.isConsumable} onChange={(e) => setEditDraft({ ...editDraft, isConsumable: e.target.checked })} className="size-4 rounded border-zinc-600 bg-zinc-900" />
              소비재 (사용하면 수량이 줄어드는 품목)
            </label>
          </div>
        )}
      </FormModal>

      {/* 품목 추가 모달 */}
      <FormModal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="품목 추가"
        description="같은 카테고리 안에서도 품목을 나눠 등록합니다. 예: 신라면·열라면처럼 이름을 구체적으로 쓰고, 포장 사진을 올리면 목록에서 더 쉽게 구분할 수 있습니다."
        submitLabel="추가"
        onSubmit={handleSubmitProduct}
        submitDisabled={!prodName.trim() || !categoryIdForProd}
        zOffset={10}
      >
        <CatalogModalFormBody>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-300">카테고리</label>
              <select value={categoryIdForProd} onChange={(e) => setProdCategoryId(e.target.value)} className={`${inputClass} mt-1`}>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-300">품목명</label>
              <input value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="예: 신라면, 열라면 (품목마다 따로 등록)" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-300">설명 (선택)</label>
              <textarea value={prodDescription} onChange={(e) => setProdDescription(e.target.value)} placeholder="브랜드·메모 등" rows={2} className={`${inputClass} mt-1 resize-y`} />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-300">사진 (선택)</label>
              <input
                type="file"
                accept="image/*"
                className={`${inputClass} mt-1 cursor-pointer text-xs file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-zinc-800 file:px-2 file:py-1 file:text-teal-200`}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  const r = await readImageFileAsDataUrl(f, MAX_CATALOG_IMAGE_BYTES);
                  if (!r.ok) { toast({ title: "이미지를 넣을 수 없습니다", description: r.reason, variant: "warning" }); return; }
                  setProdImageUrl(r.dataUrl);
                }}
              />
              {prodImageUrl ? (
                <div className="mt-2 flex items-start gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={prodImageUrl} alt="" className="h-16 w-16 rounded-lg border border-zinc-700 object-cover" />
                  <button type="button" className="text-xs text-rose-400 hover:underline" onClick={() => setProdImageUrl(null)}>사진 제거</button>
                </div>
              ) : null}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={prodConsumable} onChange={(e) => setProdConsumable(e.target.checked)} className="rounded border-zinc-600" />
              소비형 품목
            </label>
          </div>
        </CatalogModalFormBody>
      </FormModal>

      {/* 삭제 확인 모달 */}
      <AlertModal
        open={deleteTarget !== null}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title="품목 삭제"
        description={deleteTarget ? `「${deleteTarget.label}」 품목과 연결된 모든 용량·포장을 삭제합니다.` : undefined}
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        onConfirm={handleConfirmDelete}
        zOffset={10}
      />
    </MotionModalLayer>
  );
}
