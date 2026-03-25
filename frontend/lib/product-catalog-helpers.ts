/**
 * 상품 카탈로그 유틸 — 카탈로그 데이터를 기반으로 표시 문자열·이미지 등을 계산하는 순수 함수.
 * 목 시드 데이터는 포함하지 않는다(→ mock service).
 */
import type { InventoryRow, ProductCatalog } from "@/types/domain";

export function inventoryDisplayLine(
  catalog: ProductCatalog,
  row: InventoryRow,
): string {
  if (!row.categoryId || !row.productId || !row.productVariantId) {
    return row.name;
  }
  const c = catalog.categories.find((x) => x.id === row.categoryId);
  const p = catalog.products.find((x) => x.id === row.productId);
  const v = catalog.variants.find((x) => x.id === row.productVariantId);
  const cap = row.variantCaption ?? v?.name ?? `${v?.quantityPerUnit ?? ""}`;
  return [c?.name, p?.name, cap].filter(Boolean).join(" › ");
}

/** 카탈로그에서 productId로 이미지 URL 찾기 */
export function resolveProductImageUrl(
  catalog: ProductCatalog,
  productId: string | undefined,
): string | undefined {
  if (!productId) return undefined;
  return catalog.products.find((p) => p.id === productId)?.imageUrl;
}

/** 표 컬럼용 — id 없으면 `name`의 「 › 」로 추정 */
export function resolveInventoryRowColumns(
  catalog: ProductCatalog,
  it: InventoryRow,
): { category: string; product: string; spec: string } {
  if (it.categoryId && it.productId) {
    const cat =
      catalog.categories.find((c) => c.id === it.categoryId)?.name ?? "—";
    const prod =
      catalog.products.find((p) => p.id === it.productId)?.name ?? "—";
    const vr = it.productVariantId
      ? catalog.variants.find((v) => v.id === it.productVariantId)
      : undefined;
    const spec =
      it.variantCaption ??
      vr?.name ??
      (vr != null ? String(vr.quantityPerUnit) : "—");
    return { category: cat, product: prod, spec };
  }
  const parts = it.name.split("›").map((s) => s.trim());
  return {
    category: parts[0] || "—",
    product: parts[1] || "—",
    spec: parts[2] || "—",
  };
}
