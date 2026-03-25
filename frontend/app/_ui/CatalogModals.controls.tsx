"use client";

import { FormModal } from "@/app/_ui/form-modal";
import { newEntityId } from "@/app/(mock)/mock/dashboard/_lib/dashboard-helpers";
import { MAX_CATALOG_IMAGE_BYTES, readImageFileAsDataUrl } from "@/lib/image-upload";
import { toast } from "@/hooks/use-toast";
import type {
  CatalogProduct,
  CatalogProductVariant,
  ProductCatalog,
} from "@/types/domain";
import { FolderTree, Package, PackagePlus } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const catalogModalBodyEase = [0.4, 0, 0.2, 1] as const;

/** FormModal 내부 필드 — 외곽 MotionModalLayer와 겹치지 않게 짧게 뒤따라 올라옴 */
function CatalogModalFormBody({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        delay: 0.04,
        ease: catalogModalBodyEase,
      }}
    >
      {children}
    </motion.div>
  );
}

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30";

const btnOutline =
  "cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800";

/** 물품 추가 패널 헤더 등 —「접기」와 동일 높이·타이포 */
const btnPanel =
  "cursor-pointer rounded-lg border border-zinc-600 px-2 py-1 text-xs font-medium whitespace-nowrap text-zinc-300 hover:bg-zinc-800 sm:px-2.5";

function sortByOrder<T extends { sortOrder?: number }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || 0,
  );
}

export type CatalogModalsControlsProps = {
  catalog: ProductCatalog;
  onCatalogUpdate: (fn: (c: ProductCatalog) => ProductCatalog) => void;
  /** 설정 카드 / 대시보드 상단 / 물품 추가 패널 */
  layout: "settings" | "toolbar" | "panel";
  /** 버튼 줄에 추가 클래스 (예: `justify-end`) */
  buttonRowClassName?: string;
};

/**
 * 카테고리·품목·용량·포장 추가 모달 묶음 (`/dashboard`, `/mock/dashboard`, 설정 공통).
 */
export function CatalogModalsControls({
  catalog,
  onCatalogUpdate,
  layout,
  buttonRowClassName,
}: CatalogModalsControlsProps) {
  const [catOpen, setCatOpen] = useState(false);
  const [catName, setCatName] = useState("");

  const [prodOpen, setProdOpen] = useState(false);
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodConsumable, setProdConsumable] = useState(true);
  const [prodDescription, setProdDescription] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState<string | null>(null);

  const [varOpen, setVarOpen] = useState(false);
  const [varCategoryId, setVarCategoryId] = useState("");
  const [varProductId, setVarProductId] = useState("");
  const [varUnitId, setVarUnitId] = useState("");
  const [varQtyPer, setVarQtyPer] = useState("500");
  const [varLabel, setVarLabel] = useState("");

  const categories = useMemo(
    () => sortByOrder(catalog.categories),
    [catalog.categories],
  );
  const units = useMemo(() => sortByOrder(catalog.units), [catalog.units]);

  const categoryIdForProd = useMemo(() => {
    if (prodCategoryId && categories.some((c) => c.id === prodCategoryId)) {
      return prodCategoryId;
    }
    return categories[0]?.id ?? "";
  }, [categories, prodCategoryId]);

  const categoryIdForVar = useMemo(() => {
    if (varCategoryId && categories.some((c) => c.id === varCategoryId)) {
      return varCategoryId;
    }
    return categories[0]?.id ?? "";
  }, [categories, varCategoryId]);

  const productsInVarCategory = useMemo(() => {
    if (!categoryIdForVar) return [];
    return catalog.products
      .filter((p) => p.categoryId === categoryIdForVar)
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [catalog.products, categoryIdForVar]);

  const varProductIdResolved = useMemo(() => {
    if (
      varProductId &&
      productsInVarCategory.some((p) => p.id === varProductId)
    ) {
      return varProductId;
    }
    return productsInVarCategory[0]?.id ?? "";
  }, [varProductId, productsInVarCategory]);

  const varUnitIdResolved = useMemo(() => {
    if (varUnitId && units.some((u) => u.id === varUnitId)) return varUnitId;
    return units[0]?.id ?? "";
  }, [varUnitId, units]);

  const variantsInVarProduct = useMemo(() => {
    if (!varProductIdResolved) return [];
    return catalog.variants.filter((v) => v.productId === varProductIdResolved);
  }, [catalog.variants, varProductIdResolved]);

  const varSelectedProduct = useMemo(
    () => catalog.products.find((p) => p.id === varProductIdResolved),
    [catalog.products, varProductIdResolved],
  );

  const updateCatalog = useCallback(
    (fn: (c: ProductCatalog) => ProductCatalog) => {
      onCatalogUpdate(fn);
    },
    [onCatalogUpdate],
  );

  const handleSubmitCategory = () => {
    const name = catName.trim();
    if (!name) {
      toast({ title: "이름을 입력하세요", variant: "warning" });
      return;
    }
    const id = newEntityId();
    const nextSort =
      Math.max(0, ...catalog.categories.map((c) => c.sortOrder ?? 0)) + 1;
    updateCatalog((c) => ({
      ...c,
      categories: [...c.categories, { id, name, sortOrder: nextSort }],
    }));
    setCatName("");
    setCatOpen(false);
    toast({ title: "카테고리 추가됨", description: name });
  };

  const handleSubmitProduct = () => {
    const name = prodName.trim();
    if (!name || !categoryIdForProd) {
      toast({
        title: "입력을 확인하세요",
        description: "카테고리와 품목명을 채워 주세요.",
        variant: "warning",
      });
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
    updateCatalog((c) => ({
      ...c,
      products: [...c.products, p],
    }));
    setProdName("");
    setProdDescription("");
    setProdImageUrl(null);
    setProdOpen(false);
    toast({ title: "품목 추가됨", description: name });
  };

  const handleSubmitVariant = () => {
    if (!varProductIdResolved || !varUnitIdResolved) {
      toast({ title: "선택을 완료하세요", variant: "warning" });
      return;
    }
    const q = Number(varQtyPer);
    if (!Number.isFinite(q) || q <= 0) {
      toast({
        title: "용량/수량 확인",
        description: "0보다 큰 숫자여야 합니다.",
        variant: "warning",
      });
      return;
    }
    const id = newEntityId();
    const unit = catalog.units.find((u) => u.id === varUnitIdResolved);
    const label =
      varLabel.trim() || (unit ? `${q}${unit.symbol}` : String(q));
    const productForToast = catalog.products.find(
      (p) => p.id === varProductIdResolved,
    );
    const toastDesc = productForToast
      ? `${productForToast.name} › ${label}`
      : label;
    const v: CatalogProductVariant = {
      id,
      productId: varProductIdResolved,
      unitId: varUnitIdResolved,
      quantityPerUnit: q,
      name: label,
      isDefault: variantsInVarProduct.length === 0,
    };
    updateCatalog((c) => ({
      ...c,
      variants: [...c.variants, v],
    }));
    setVarLabel("");
    setVarQtyPer("500");
    setVarOpen(false);
    toast({ title: "용량·포장 추가됨", description: toastDesc });
  };

  const buttonRowClass = cn(
    layout === "settings"
      ? "mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
      : "flex flex-wrap items-center gap-2",
    buttonRowClassName,
  );

  const btnClass = layout === "panel" ? btnPanel : btnOutline;
  const catalogBtnIconClass =
    layout === "panel" ? "size-3.5 shrink-0 opacity-90" : "size-4 shrink-0 opacity-90";

  return (
    <>
      <div className={buttonRowClass}>
        <button
          type="button"
          className={cn(btnClass, "inline-flex items-center justify-center gap-1.5")}
          onClick={() => {
            setCatName("");
            setCatOpen(true);
          }}
        >
          <FolderTree className={catalogBtnIconClass} aria-hidden />
          카테고리 추가
        </button>
        <button
          type="button"
          className={cn(btnClass, "inline-flex items-center justify-center gap-1.5")}
          onClick={() => {
            setProdCategoryId(categories[0]?.id ?? "");
            setProdName("");
            setProdDescription("");
            setProdImageUrl(null);
            setProdConsumable(true);
            setProdOpen(true);
          }}
          disabled={categories.length === 0}
        >
          <Package className={catalogBtnIconClass} aria-hidden />
          품목 추가
        </button>
        <button
          type="button"
          className={cn(btnClass, "inline-flex items-center justify-center gap-1.5")}
          onClick={() => {
            setVarCategoryId(categories[0]?.id ?? "");
            setVarProductId("");
            setVarUnitId(units[0]?.id ?? "");
            setVarQtyPer("500");
            setVarLabel("");
            setVarOpen(true);
          }}
          disabled={categories.length === 0 || units.length === 0}
        >
          <PackagePlus className={catalogBtnIconClass} aria-hidden />
          용량·포장 추가
        </button>
      </div>

      {/* 카운트 요약은 settings 레이아웃에서 CatalogListView가 표시 */}

      <FormModal
        open={catOpen}
        onOpenChange={setCatOpen}
        title="카테고리 추가"
        description="대분류 한 단계(예: 식료품, 생활용품)입니다."
        submitLabel="추가"
        onSubmit={handleSubmitCategory}
        submitDisabled={!catName.trim()}
      >
        <CatalogModalFormBody>
          <label className="block text-xs font-medium text-zinc-300">
            이름
          </label>
          <input
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="예: 식료품"
            className={`${inputClass} mt-1`}
          />
        </CatalogModalFormBody>
      </FormModal>

      <FormModal
        open={prodOpen}
        onOpenChange={setProdOpen}
        title="품목 추가"
        description="같은 카테고리 안에서도 품목을 나눠 등록합니다. 예: 신라면·열라면처럼 이름을 구체적으로 쓰고, 포장 사진을 올리면 목록에서 더 쉽게 구분할 수 있습니다."
        submitLabel="추가"
        onSubmit={handleSubmitProduct}
        submitDisabled={!prodName.trim() || !categoryIdForProd}
      >
        <CatalogModalFormBody>
          <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-300">
              카테고리
            </label>
            <select
              value={categoryIdForProd}
              onChange={(e) => setProdCategoryId(e.target.value)}
              className={`${inputClass} mt-1`}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-300">
              품목명
            </label>
            <input
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
              placeholder="예: 신라면, 열라면 (품목마다 따로 등록)"
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-300">
              설명 (선택)
            </label>
            <textarea
              value={prodDescription}
              onChange={(e) => setProdDescription(e.target.value)}
              placeholder="브랜드·메모 등"
              rows={2}
              className={`${inputClass} mt-1 resize-y`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-300">
              사진 (선택)
            </label>
            <input
              type="file"
              accept="image/*"
              className={`${inputClass} mt-1 cursor-pointer text-xs file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-zinc-800 file:px-2 file:py-1 file:text-teal-200`}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                const r = await readImageFileAsDataUrl(f, MAX_CATALOG_IMAGE_BYTES);
                if (!r.ok) {
                  toast({
                    title: "이미지를 넣을 수 없습니다",
                    description: r.reason,
                    variant: "warning",
                  });
                  return;
                }
                setProdImageUrl(r.dataUrl);
              }}
            />
            {prodImageUrl ? (
              <div className="mt-2 flex items-start gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prodImageUrl}
                  alt=""
                  className="h-16 w-16 rounded-lg border border-zinc-700 object-cover"
                />
                <button
                  type="button"
                  className="text-xs text-rose-400 hover:underline"
                  onClick={() => setProdImageUrl(null)}
                >
                  사진 제거
                </button>
              </div>
            ) : null}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={prodConsumable}
              onChange={(e) => setProdConsumable(e.target.checked)}
              className="rounded border-zinc-600"
            />
            소비형 품목
          </label>
          </div>
        </CatalogModalFormBody>
      </FormModal>

      <FormModal
        open={varOpen}
        onOpenChange={setVarOpen}
        title="용량·포장 추가"
        description="선택한 품목에 단위·용량(예: 500ml, 1팩 5개입)을 붙입니다."
        submitLabel="추가"
        onSubmit={handleSubmitVariant}
        submitDisabled={
          !varProductIdResolved ||
          !varUnitIdResolved ||
          !Number.isFinite(Number(varQtyPer)) ||
          Number(varQtyPer) <= 0
        }
      >
        <CatalogModalFormBody>
          <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-300">
              카테고리
            </label>
            <select
              value={categoryIdForVar}
              onChange={(e) => {
                setVarCategoryId(e.target.value);
                setVarProductId("");
              }}
              className={`${inputClass} mt-1`}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-300">품목</label>
            <select
              value={varProductIdResolved}
              onChange={(e) => setVarProductId(e.target.value)}
              disabled={productsInVarCategory.length === 0}
              className={`${inputClass} mt-1 disabled:opacity-50`}
            >
              {productsInVarCategory.length === 0 ? (
                <option value="">이 카테고리에 품목이 없습니다</option>
              ) : (
                productsInVarCategory.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>
          {varSelectedProduct ? (
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
              {varSelectedProduct.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={varSelectedProduct.imageUrl}
                  alt=""
                  className="size-12 shrink-0 rounded-lg border border-zinc-700 object-cover"
                />
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900 text-xs text-zinc-300">
                  사진 없음
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-300">
                  적용할 품목
                </p>
                <p className="truncate text-sm font-semibold text-zinc-100">
                  {varSelectedProduct.name}
                </p>
              </div>
            </div>
          ) : null}
          <div>
            <label className="text-xs font-medium text-zinc-300">단위</label>
            <select
              value={varUnitIdResolved}
              onChange={(e) => setVarUnitId(e.target.value)}
              className={`${inputClass} mt-1`}
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.symbol}
                  {u.name ? ` (${u.name})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-300">
              용량 / 개수 (한 단위당)
            </label>
            <input
              type="number"
              min={0.01}
              step="any"
              value={varQtyPer}
              onChange={(e) => setVarQtyPer(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-300">
              표시 이름 (선택)
            </label>
            <input
              value={varLabel}
              onChange={(e) => setVarLabel(e.target.value)}
              placeholder="비우면 단위·수량으로 생성"
              className={`${inputClass} mt-1`}
            />
          </div>
          </div>
        </CatalogModalFormBody>
      </FormModal>
    </>
  );
}
