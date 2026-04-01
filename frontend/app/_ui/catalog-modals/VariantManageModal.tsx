"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { FormModal } from "@/app/_ui/form-modal";
import { newEntityId } from "@/app/(mock)/mock/dashboard/_lib/dashboard-helpers";
import { toast } from "@/hooks/use-toast";
import type { CatalogProductVariant, ProductCatalog } from "@/types/domain";
import { PackagePlus, Pencil, Plus, Ruler, Trash2, X } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import { CatalogModalFormBody, CatalogModalNav, inputClass, sortByOrder, type CatalogModalId } from "./shared";

/** 단위 기호로부터 기본 용량/개수 추론 */
function guessDefaultQty(symbol: string): string {
  const s = symbol.toLowerCase();
  if (s.includes("ml")) return "500";
  if (s.includes("l") || s.includes("리터")) return "1";
  if (s.includes("mg")) return "500";
  if (s.includes("kg")) return "1";
  if (s.includes("g") || s.includes("그램")) return "100";
  return "1";
}

type EditVariantDraft = {
  id: string;
  unitId: string;
  quantityPerUnit: string;
  name: string;
};

export function VariantManageModal({
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
  const titleId = `var-manage-title-${uid}`;

  const categories = useMemo(() => sortByOrder(catalog.categories), [catalog.categories]);
  const units = useMemo(() => sortByOrder(catalog.units), [catalog.units]);

  /* ── 좌측: 필터 ── */
  const [filterCategoryId, setFilterCategoryId] = useState("");

  const categoryIdResolved = useMemo(() => {
    if (filterCategoryId && categories.some((c) => c.id === filterCategoryId)) return filterCategoryId;
    return categories[0]?.id ?? "";
  }, [categories, filterCategoryId]);

  const [filterProductId, setFilterProductId] = useState("");

  const productsInCategory = useMemo(() => {
    if (!categoryIdResolved) return [];
    return catalog.products
      .filter((p) => p.categoryId === categoryIdResolved)
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [catalog.products, categoryIdResolved]);

  const productIdResolved = useMemo(() => {
    if (filterProductId && productsInCategory.some((p) => p.id === filterProductId)) return filterProductId;
    return productsInCategory[0]?.id ?? "";
  }, [filterProductId, productsInCategory]);

  const selectedProduct = useMemo(
    () => catalog.products.find((p) => p.id === productIdResolved),
    [catalog.products, productIdResolved],
  );

  const unitMap = useMemo(() => new Map(catalog.units.map((u) => [u.id, u])), [catalog.units]);

  const variantsForProduct = useMemo(() => {
    if (!productIdResolved) return [];
    return catalog.variants.filter((v) => v.productId === productIdResolved);
  }, [catalog.variants, productIdResolved]);

  /* ── 좌측: 용량·포장 수정 ── */
  const [editDraft, setEditDraft] = useState<EditVariantDraft | null>(null);

  const handleStartEdit = (v: CatalogProductVariant) => {
    setEditDraft({ id: v.id, unitId: v.unitId, quantityPerUnit: String(v.quantityPerUnit), name: v.name ?? "" });
  };

  const handleSaveEdit = useCallback(() => {
    if (!editDraft) return;
    const q = Number(editDraft.quantityPerUnit);
    if (!Number.isFinite(q) || q <= 0) {
      toast({ title: "용량/수량 확인", description: "0보다 큰 숫자여야 합니다.", variant: "warning" });
      return;
    }
    const d = editDraft;
    const unit = catalog.units.find((u) => u.id === d.unitId);
    const label = d.name.trim() || (unit ? `${q}${unit.symbol}` : String(q));
    onCatalogUpdate((c) => ({
      ...c,
      variants: c.variants.map((v) =>
        v.id === d.id ? { ...v, unitId: d.unitId, quantityPerUnit: q, name: label } : v,
      ),
    }));
    setEditDraft(null);
    toast({ title: "용량·포장 수정됨", description: label });
  }, [editDraft, catalog.units, onCatalogUpdate]);

  /* ── 좌측: 용량·포장 삭제 ── */
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    onCatalogUpdate((c) => ({ ...c, variants: c.variants.filter((v) => v.id !== deleteTarget.id) }));
    setDeleteTarget(null);
    toast({ title: "용량·포장 삭제됨", description: deleteTarget.label });
  }, [deleteTarget, onCatalogUpdate]);

  /* ── 우측: 추가 폼 ── */
  const [addUnitId, setAddUnitId] = useState("");
  const [addQtyPer, setAddQtyPer] = useState("1");
  const [addLabel, setAddLabel] = useState("");

  const addUnitIdResolved = useMemo(() => {
    if (addUnitId && units.some((u) => u.id === addUnitId)) return addUnitId;
    return units[0]?.id ?? "";
  }, [addUnitId, units]);

  const handleSelectUnit = useCallback((unitId: string) => {
    setAddUnitId(unitId);
    const u = catalog.units.find((x) => x.id === unitId);
    if (u) setAddQtyPer(guessDefaultQty(u.symbol));
  }, [catalog.units]);

  const canSubmitAdd = !!productIdResolved && !!addUnitIdResolved && Number.isFinite(Number(addQtyPer)) && Number(addQtyPer) > 0;

  const handleSubmitAdd = () => {
    if (!canSubmitAdd) return;
    const q = Number(addQtyPer);
    const unit = catalog.units.find((u) => u.id === addUnitIdResolved);
    const label = addLabel.trim() || (unit ? `${q}${unit.symbol}` : String(q));
    const id = newEntityId();
    const v: CatalogProductVariant = {
      id,
      productId: productIdResolved,
      unitId: addUnitIdResolved,
      quantityPerUnit: q,
      name: label,
      isDefault: variantsForProduct.length === 0,
    };
    onCatalogUpdate((c) => ({ ...c, variants: [...c.variants, v] }));
    setAddLabel("");
    toast({ title: "용량·포장 추가됨", description: `${selectedProduct?.name ?? ""} › ${label}` });
  };

  /* ── 단위 CRUD (모달 기반) ── */
  const [unitAddOpen, setUnitAddOpen] = useState(false);
  const [unitAddSymbol, setUnitAddSymbol] = useState("");
  const [unitAddName, setUnitAddName] = useState("");

  const [unitEditTarget, setUnitEditTarget] = useState<{ id: string; symbol: string; name: string } | null>(null);
  const [unitEditSymbol, setUnitEditSymbol] = useState("");
  const [unitEditName, setUnitEditName] = useState("");

  const [unitDeleteTarget, setUnitDeleteTarget] = useState<{ id: string; symbol: string } | null>(null);

  const variantCountByUnit = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of catalog.variants) map.set(v.unitId, (map.get(v.unitId) ?? 0) + 1);
    return map;
  }, [catalog.variants]);

  const handleUnitAddSubmit = () => {
    const symbol = unitAddSymbol.trim();
    if (!symbol) { toast({ title: "기호를 입력하세요", variant: "warning" }); return; }
    const id = newEntityId();
    const nextSort = Math.max(0, ...catalog.units.map((u) => u.sortOrder ?? 0)) + 1;
    const name = unitAddName.trim() || undefined;
    onCatalogUpdate((c) => ({
      ...c,
      units: [...c.units, { id, symbol, ...(name ? { name } : {}), sortOrder: nextSort }],
    }));
    handleSelectUnit(id);
    setUnitAddOpen(false);
    toast({ title: "단위 추가됨", description: symbol });
  };

  const handleUnitEditSubmit = () => {
    if (!unitEditTarget || !unitEditSymbol.trim()) return;
    const symbol = unitEditSymbol.trim();
    const name = unitEditName.trim() || undefined;
    onCatalogUpdate((c) => ({
      ...c,
      units: c.units.map((u) => u.id === unitEditTarget.id ? { ...u, symbol, name } : u),
    }));
    setUnitEditTarget(null);
    toast({ title: "단위 수정됨", description: symbol });
  };

  const handleUnitDeleteConfirm = useCallback(() => {
    if (!unitDeleteTarget) return;
    onCatalogUpdate((c) => ({ ...c, units: c.units.filter((u) => u.id !== unitDeleteTarget.id) }));
    setUnitDeleteTarget(null);
    toast({ title: "단위 삭제됨", description: unitDeleteTarget.symbol });
  }, [unitDeleteTarget, onCatalogUpdate]);

  return (
    <MotionModalLayer
      open
      onOpenChange={(v) => !v && onClose()}
      closeOnOverlayClick
      panelClassName="fixed left-1/2 top-1/2 z-10041 max-h-[min(100dvh-2rem,48rem)] w-[min(100vw-2rem,60rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
      ariaLabelledBy={titleId}
    >
      <div className="flex max-h-[min(100dvh-2rem,48rem)] flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300">
              <PackagePlus className="size-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-white">
                용량·포장 관리
              </h2>
              <p className="mt-0.5 text-sm text-zinc-400">
                품목별 용량·포장을 관리하고 새 항목을 추가합니다
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200" aria-label="닫기">
            <X className="size-4" />
          </button>
        </div>

        {/* 2-column body */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* ──── 좌측: 목록 ──── */}
          <div className="flex min-h-0 flex-1 flex-col border-b border-zinc-800 md:border-b-0 md:border-r">
            {/* 필터 */}
            <div className="shrink-0 space-y-2.5 border-b border-zinc-800/60 px-5 py-3">
              <div>
                <label className="text-xs font-medium text-zinc-400">카테고리</label>
                <select
                  value={categoryIdResolved}
                  onChange={(e) => { setFilterCategoryId(e.target.value); setFilterProductId(""); }}
                  className="mt-1 w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
                >
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400">품목</label>
                <select
                  value={productIdResolved}
                  onChange={(e) => setFilterProductId(e.target.value)}
                  disabled={productsInCategory.length === 0}
                  className="mt-1 w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 disabled:opacity-50"
                >
                  {productsInCategory.length === 0 ? (
                    <option value="">이 카테고리에 품목이 없습니다</option>
                  ) : (
                    productsInCategory.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))
                  )}
                </select>
              </div>
            </div>

            {/* variant list */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4">
              {!productIdResolved ? (
                <div className="py-6 text-center"><p className="text-sm text-zinc-500">품목을 먼저 선택하세요</p></div>
              ) : variantsForProduct.length === 0 ? (
                <div className="py-6 text-center"><p className="text-sm text-zinc-500">등록된 용량·포장이 없습니다</p></div>
              ) : (
                <div className="space-y-1.5">
                  {variantsForProduct.map((v) => {
                    const unit = unitMap.get(v.unitId);
                    const label = v.name || `${v.quantityPerUnit}${unit?.symbol ?? ""}`;
                    return (
                      <div key={v.id} className="flex items-center gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/40 px-3.5 py-2.5">
                        <PackagePlus className="size-4 shrink-0 text-zinc-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-200">{label}</p>
                          <p className="text-xs text-zinc-500">
                            {v.quantityPerUnit}{unit?.symbol ?? ""}{unit?.name ? ` (${unit.name})` : ""}
                            {v.isDefault && <span className="ml-2 text-teal-400/70">기본</span>}
                          </p>
                        </div>
                        <button type="button" onClick={() => handleStartEdit(v)} className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-teal-300" aria-label={`${label} 수정`}>
                          <Pencil className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget({ id: v.id, label: `${selectedProduct?.name ?? ""} › ${label}` })} className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-rose-400" aria-label={`${label} 삭제`}>
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ──── 우측: 단위 선택 + 추가 폼 ──── */}
          <div className="flex w-full flex-col md:w-[18rem] md:shrink-0">
            {/* 헤더 */}
            <div className="shrink-0 border-b border-zinc-800/60 px-4 py-3">
              <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">새 용량·포장</p>
            </div>

            {/* 단위 선택 */}
            <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-2">
              <div className="flex items-center gap-1.5">
                <Ruler className="size-3.5 text-zinc-400" />
                <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">단위</p>
                <span className="text-xs text-zinc-500">{units.length}개</span>
              </div>
              <button
                type="button"
                onClick={() => { setUnitAddSymbol(""); setUnitAddName(""); setUnitAddOpen(true); }}
                className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
              >
                <Plus className="size-3" />
                추가
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-3">
              {units.length === 0 ? (
                <div className="py-4 text-center"><p className="text-xs text-zinc-500">단위를 추가하세요</p></div>
              ) : (
                <div className="space-y-1">
                  {units.map((u) => {
                    const isSelected = addUnitIdResolved === u.id;
                    const vCount = variantCountByUnit.get(u.id) ?? 0;
                    return (
                      <div
                        key={u.id}
                        className={cn(
                          "cursor-pointer rounded-lg border px-3 py-2 transition",
                          isSelected
                            ? "border-teal-500/50 bg-teal-500/10 ring-1 ring-teal-500/20"
                            : "border-zinc-800/60 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-800/40",
                        )}
                        onClick={() => handleSelectUnit(u.id)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border", isSelected ? "border-teal-500 bg-teal-500" : "border-zinc-600")}>
                            {isSelected && <div className="size-1.5 rounded-full bg-zinc-950" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className={cn("text-sm font-medium", isSelected ? "text-teal-200" : "text-zinc-200")}>{u.symbol}</span>
                            {u.name && <span className="ml-1.5 text-xs text-zinc-500">({u.name})</span>}
                            {vCount > 0 && <span className="ml-1.5 text-xs text-zinc-600">·{vCount}건</span>}
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setUnitEditTarget({ id: u.id, symbol: u.symbol, name: u.name ?? "" }); setUnitEditSymbol(u.symbol); setUnitEditName(u.name ?? ""); }} className="shrink-0 rounded p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-teal-300" aria-label={`${u.symbol} 수정`}>
                            <Pencil className="size-3" />
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setUnitDeleteTarget({ id: u.id, symbol: u.symbol }); }} className="shrink-0 rounded p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-rose-400" aria-label={`${u.symbol} 삭제`}>
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 추가 폼 */}
            <div className="shrink-0 space-y-3 border-t border-zinc-800/60 px-4 py-4">
              {/* 선택된 단위 표시 */}
              {addUnitIdResolved ? (
                <div className="flex items-center gap-2 rounded-lg border border-teal-500/40 bg-teal-500/5 px-2.5 py-1.5">
                  <Ruler className="size-3.5 shrink-0 text-teal-400" />
                  <span className="text-xs font-medium text-teal-200">
                    {(() => { const u = units.find((x) => x.id === addUnitIdResolved); return u ? `${u.symbol}${u.name ? ` (${u.name})` : ""}` : ""; })()}
                  </span>
                </div>
              ) : (
                <p className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-500">
                  위에서 단위를 선택하세요
                </p>
              )}
              <div>
                <label className="text-xs font-medium text-zinc-300">용량 / 개수</label>
                <input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={addQtyPer} onChange={(e) => { if (/^[0-9]*\.?[0-9]*$/.test(e.target.value)) setAddQtyPer(e.target.value); }} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-sm text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-300">표시 이름 (선택)</label>
                <input value={addLabel} onChange={(e) => setAddLabel(e.target.value)} placeholder="비우면 자동 생성" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30" />
              </div>
              <button
                type="button"
                onClick={handleSubmitAdd}
                disabled={!canSubmitAdd}
                className="w-full rounded-lg bg-teal-500 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-teal-400 disabled:opacity-40"
              >
                추가
              </button>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-zinc-800 p-4">
          <CatalogModalNav current="variant" onNavigate={onNavigate} />
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400">
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* 용량·포장 수정 모달 */}
      <FormModal
        open={editDraft !== null}
        onOpenChange={(v) => { if (!v) setEditDraft(null); }}
        title="용량·포장 수정"
        onSubmit={handleSaveEdit}
        submitLabel="저장"
        submitDisabled={!editDraft || !Number.isFinite(Number(editDraft.quantityPerUnit)) || Number(editDraft.quantityPerUnit) <= 0}
        zOffset={10}
      >
        {editDraft && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400">단위</label>
              <select value={editDraft.unitId} onChange={(e) => setEditDraft({ ...editDraft, unitId: e.target.value })} className="mt-1 w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500">
                {units.map((u) => (<option key={u.id} value={u.id}>{u.symbol}{u.name ? ` (${u.name})` : ""}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400">용량 / 개수</label>
              <input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={editDraft.quantityPerUnit} onChange={(e) => { if (/^[0-9]*\.?[0-9]*$/.test(e.target.value)) setEditDraft({ ...editDraft, quantityPerUnit: e.target.value }); }} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400">표시 이름</label>
              <input type="text" value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} placeholder="비우면 단위·수량으로 생성" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
            </div>
          </div>
        )}
      </FormModal>

      {/* 용량·포장 삭제 확인 */}
      <AlertModal
        open={deleteTarget !== null}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title="용량·포장 삭제"
        description={deleteTarget ? `「${deleteTarget.label}」 용량·포장을 삭제합니다.` : undefined}
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        onConfirm={handleConfirmDelete}
        zOffset={10}
      />

      {/* 단위 추가 모달 */}
      <FormModal
        open={unitAddOpen}
        onOpenChange={setUnitAddOpen}
        title="단위 추가"
        description="새 단위를 등록합니다. 기호는 필수입니다."
        submitLabel="추가"
        onSubmit={handleUnitAddSubmit}
        submitDisabled={!unitAddSymbol.trim()}
        zOffset={10}
      >
        <CatalogModalFormBody>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-300">기호 (필수)</label>
              <input value={unitAddSymbol} onChange={(e) => setUnitAddSymbol(e.target.value)} placeholder="예: ml, 개, kg" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-300">이름 (선택)</label>
              <input value={unitAddName} onChange={(e) => setUnitAddName(e.target.value)} placeholder="예: 밀리리터, 개, 킬로그램" className={`${inputClass} mt-1`} />
            </div>
          </div>
        </CatalogModalFormBody>
      </FormModal>

      {/* 단위 수정 모달 */}
      <FormModal
        open={unitEditTarget !== null}
        onOpenChange={(v) => { if (!v) setUnitEditTarget(null); }}
        title="단위 수정"
        onSubmit={handleUnitEditSubmit}
        submitLabel="저장"
        submitDisabled={!unitEditSymbol.trim()}
        zOffset={10}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400">기호</label>
            <input value={unitEditSymbol} onChange={(e) => setUnitEditSymbol(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400">이름 (선택)</label>
            <input value={unitEditName} onChange={(e) => setUnitEditName(e.target.value)} placeholder="비우면 기호만 표시" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
          </div>
        </div>
      </FormModal>

      {/* 단위 삭제 확인 */}
      <AlertModal
        open={unitDeleteTarget !== null}
        onOpenChange={(v) => { if (!v) setUnitDeleteTarget(null); }}
        title="단위 삭제"
        description={unitDeleteTarget ? `「${unitDeleteTarget.symbol}」 단위를 삭제합니다.${(variantCountByUnit.get(unitDeleteTarget.id) ?? 0) > 0 ? ` 이 단위를 사용 중인 용량·포장 ${variantCountByUnit.get(unitDeleteTarget.id)}건이 있습니다.` : ""}` : undefined}
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        onConfirm={handleUnitDeleteConfirm}
        zOffset={10}
      />
    </MotionModalLayer>
  );
}
