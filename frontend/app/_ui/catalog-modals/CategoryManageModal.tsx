"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { newEntityId } from "@/app/(mock)/mock/dashboard/_lib/dashboard-helpers";
import { toast } from "@/hooks/use-toast";
import type { ProductCatalog } from "@/types/domain";
import { FolderTree, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import { CatalogModalNav, sortByOrder, type CatalogModalId } from "./shared";

export function CategoryManageModal({
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
  const titleId = `cat-manage-title-${uid}`;
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const addRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => addRef.current?.focus(), 100);
  }, []);

  const categories = useMemo(() => sortByOrder(catalog.categories), [catalog.categories]);

  const productCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of catalog.products) map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    return map;
  }, [catalog.products]);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) { toast({ title: "이름을 입력하세요", variant: "warning" }); return; }
    const id = newEntityId();
    const nextSort = Math.max(0, ...catalog.categories.map((c) => c.sortOrder ?? 0)) + 1;
    onCatalogUpdate((c) => ({
      ...c,
      categories: [...c.categories, { id, name, sortOrder: nextSort }],
    }));
    setNewName("");
    addRef.current?.focus();
    toast({ title: "카테고리 추가됨", description: name });
  };

  const handleSaveEdit = () => {
    if (!editId || !editName.trim()) return;
    const name = editName.trim();
    onCatalogUpdate((c) => ({
      ...c,
      categories: c.categories.map((cat) =>
        cat.id === editId ? { ...cat, name } : cat,
      ),
    }));
    setEditId(null);
    toast({ title: "카테고리 수정됨", description: name });
  };

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    const productIds = new Set(
      catalog.products.filter((p) => p.categoryId === id).map((p) => p.id),
    );
    onCatalogUpdate((c) => ({
      ...c,
      categories: c.categories.filter((cat) => cat.id !== id),
      products: c.products.filter((p) => p.categoryId !== id),
      variants: c.variants.filter((v) => !productIds.has(v.productId)),
    }));
    setDeleteTarget(null);
    toast({ title: "카테고리 삭제됨", description: deleteTarget.name });
  }, [deleteTarget, catalog.products, onCatalogUpdate]);

  return (
    <MotionModalLayer
      open
      onOpenChange={(v) => !v && onClose()}
      closeOnOverlayClick
      panelClassName="fixed left-1/2 top-1/2 z-10041 max-h-[min(100dvh-2rem,40rem)] w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
      ariaLabelledBy={titleId}
    >
      <div className="flex max-h-[min(100dvh-2rem,40rem)] flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300">
              <FolderTree className="size-4" />
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-white">
                카테고리 관리
              </h2>
              <p className="mt-0.5 text-sm text-zinc-400">
                대분류 카테고리를 추가·수정·삭제합니다
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200" aria-label="닫기">
            <X className="size-4" />
          </button>
        </div>

        {/* add row */}
        <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3">
          <input
            ref={addRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="새 카테고리 이름"
            className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="shrink-0 rounded-lg bg-teal-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-teal-400 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {/* list */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-5">
          {categories.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-zinc-500">등록된 카테고리가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {categories.map((cat) => {
                const count = productCountMap.get(cat.id) ?? 0;
                const isEditing = editId === cat.id;
                return (
                  <div key={cat.id} className="flex items-center gap-2 rounded-xl border border-zinc-800/70 bg-zinc-950/40 px-4 py-2.5">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") setEditId(null);
                          }}
                          className="min-w-0 flex-1 rounded-lg border border-teal-500/50 bg-zinc-950 px-2.5 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-teal-500/30"
                          autoFocus
                        />
                        <button type="button" onClick={handleSaveEdit} className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-teal-300 transition hover:bg-teal-500/15">
                          저장
                        </button>
                        <button type="button" onClick={() => setEditId(null)} className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800">
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <FolderTree className="size-4 shrink-0 text-teal-400/70" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">
                          {cat.name}
                        </span>
                        <span className="shrink-0 rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                          {count}개 품목
                        </span>
                        <button type="button" onClick={() => { setEditId(cat.id); setEditName(cat.name); }} className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-teal-300" aria-label={`${cat.name} 수정`}>
                          <Pencil className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })} className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-rose-400" aria-label={`${cat.name} 삭제`}>
                          <Trash2 className="size-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-zinc-800 p-4">
          <CatalogModalNav current="category" onNavigate={onNavigate} />
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              카테고리 {categories.length}개
            </p>
            <button type="button" onClick={onClose} className="cursor-pointer rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400">
              닫기
            </button>
          </div>
        </div>
      </div>

      <AlertModal
        open={deleteTarget !== null}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title="카테고리 삭제"
        description={deleteTarget ? `「${deleteTarget.name}」 카테고리와 포함된 모든 품목·용량·포장을 삭제합니다.` : undefined}
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        onConfirm={handleConfirmDelete}
        zOffset={10}
      />
    </MotionModalLayer>
  );
}
