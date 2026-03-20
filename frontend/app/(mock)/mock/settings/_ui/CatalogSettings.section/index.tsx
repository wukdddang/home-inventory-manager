"use client";

import { useDashboard } from "../../../dashboard/_hooks/useDashboard";
import { CatalogModalsControls } from "@/app/(current)/dashboard/_ui/CatalogModals.controls";

export function CatalogSettingsSection() {
  const {
    productCatalog,
    카탈로그를_갱신_한다,
    catalogHydrated,
    loading,
    error,
  } = useDashboard();

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

  if (!catalogHydrated && loading) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-base font-semibold text-white">상품 카탈로그</h2>
        <p className="mt-2 text-sm text-zinc-500">카탈로그를 불러오는 중…</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-base font-semibold text-white">상품 카탈로그</h2>
      <p className="mt-1 text-sm text-zinc-500">
        모든 거점이 같은 카테고리·품목·용량(Variant) 목록을 공유합니다. 모달로
        추가하고, 메인「물품 추가」에서는 선택만 하면 됩니다.
      </p>
      <CatalogModalsControls
        catalog={productCatalog}
        onCatalogUpdate={카탈로그를_갱신_한다}
        layout="settings"
      />
    </section>
  );
}
