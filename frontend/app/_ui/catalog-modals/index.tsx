"use client";

import type { ProductCatalog } from "@/types/domain";
import { FolderTree, Layers, Package, PackagePlus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { btnOutline, btnPanel, type CatalogModalId } from "./shared";
import { CatalogBrowserModal } from "./CatalogBrowserModal";
import { CategoryManageModal } from "./CategoryManageModal";
import { ProductManageModal } from "./ProductManageModal";
import { VariantManageModal } from "./VariantManageModal";

export type CatalogModalsControlsProps = {
  catalog: ProductCatalog;
  onCatalogUpdate: (fn: (c: ProductCatalog) => ProductCatalog) => void;
  /** 설정 카드 / 대시보드 상단 / 재고 추가 패널 */
  layout: "settings" | "toolbar" | "panel";
  /** 버튼 줄에 추가 클래스 (예: `justify-end`) */
  buttonRowClassName?: string;
};

/**
 * 카테고리·품목·용량·포장 관리 모달 묶음 (`/dashboard`, `/mock/dashboard`, 설정 공통).
 * 각 "관리" 버튼을 클릭하면 해당 영역의 CRUD를 수행할 수 있는 관리 모달이 열린다.
 */
export function CatalogModalsControls({
  catalog,
  onCatalogUpdate,
  layout,
  buttonRowClassName,
}: CatalogModalsControlsProps) {
  const [activeModal, setActiveModal] = useState<CatalogModalId | null>(null);
  const closeModal = useCallback(() => setActiveModal(null), []);

  const varDisabled = catalog.categories.length === 0 || catalog.units.length === 0;
  const disabledNavIds = useMemo(() => {
    const s = new Set<CatalogModalId>();
    if (varDisabled) s.add("variant");
    return s;
  }, [varDisabled]);

  const buttonRowClass = cn(
    layout === "settings"
      ? "mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
      : "flex flex-wrap items-center gap-2",
    buttonRowClassName,
  );

  const btnClass = layout === "panel" ? btnPanel : btnOutline;
  const iconClass =
    layout === "panel" ? "size-3.5 shrink-0 opacity-90" : "size-4 shrink-0 opacity-90";

  return (
    <>
      <div className={buttonRowClass}>
        <button
          type="button"
          className={cn(btnClass, "inline-flex items-center justify-center gap-1.5")}
          onClick={() => setActiveModal("browser")}
        >
          <Layers className={iconClass} aria-hidden />
          카탈로그 관리
        </button>
        <button
          type="button"
          className={cn(btnClass, "inline-flex items-center justify-center gap-1.5")}
          onClick={() => setActiveModal("category")}
        >
          <FolderTree className={iconClass} aria-hidden />
          카테고리 관리
        </button>
        <button
          type="button"
          className={cn(btnClass, "inline-flex items-center justify-center gap-1.5")}
          onClick={() => setActiveModal("product")}
        >
          <Package className={iconClass} aria-hidden />
          품목 관리
        </button>
        <button
          type="button"
          className={cn(btnClass, "inline-flex items-center justify-center gap-1.5")}
          onClick={() => setActiveModal("variant")}
          disabled={varDisabled}
        >
          <PackagePlus className={iconClass} aria-hidden />
          용량·포장 관리
        </button>
      </div>

      {activeModal === "browser" && (
        <CatalogBrowserModal
          onClose={closeModal}
          catalog={catalog}
          onNavigate={setActiveModal}
          disabledNavIds={disabledNavIds}
        />
      )}
      {activeModal === "category" && (
        <CategoryManageModal
          onClose={closeModal}
          catalog={catalog}
          onCatalogUpdate={onCatalogUpdate}
          onNavigate={setActiveModal}
        />
      )}
      {activeModal === "product" && (
        <ProductManageModal
          onClose={closeModal}
          catalog={catalog}
          onCatalogUpdate={onCatalogUpdate}
          onNavigate={setActiveModal}
        />
      )}
      {activeModal === "variant" && (
        <VariantManageModal
          onClose={closeModal}
          catalog={catalog}
          onCatalogUpdate={onCatalogUpdate}
          onNavigate={setActiveModal}
        />
      )}
    </>
  );
}
