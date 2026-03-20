/**
 * 논리 설계 Category / Product / ProductVariant / Unit 에 맞춘 로컬 카탈로그 기본값.
 * 거점(Household) 단위로 복제되어 저장됩니다.
 */
import type { Household, InventoryRow, ProductCatalog } from "@/types/domain";

/** 시드·신규 거점에 붙이는 기본 마스터 데이터 */
export const DEFAULT_PRODUCT_CATALOG: ProductCatalog = {
  units: [
    { id: "u-ml", symbol: "ml", name: "밀리리터", sortOrder: 1 },
    { id: "u-l", symbol: "L", name: "리터", sortOrder: 2 },
    { id: "u-g", symbol: "g", name: "그램", sortOrder: 3 },
    { id: "u-ea", symbol: "개", name: "개", sortOrder: 4 },
    { id: "u-bottle", symbol: "병", name: "병", sortOrder: 5 },
    { id: "u-pack", symbol: "팩", name: "팩", sortOrder: 6 },
    { id: "u-box", symbol: "박스", name: "박스", sortOrder: 7 },
    { id: "u-ream", symbol: "권", name: "권", sortOrder: 8 },
  ],
  categories: [
    { id: "c-food", name: "식료품", sortOrder: 1 },
    { id: "c-life", name: "생활용품", sortOrder: 2 },
    { id: "c-office", name: "사무용품", sortOrder: 3 },
    { id: "c-electronics", name: "전자·소모품", sortOrder: 4 },
  ],
  products: [
    {
      id: "p-milk",
      categoryId: "c-food",
      name: "우유",
      isConsumable: true,
    },
    {
      id: "p-ramen",
      categoryId: "c-food",
      name: "라면",
      isConsumable: true,
    },
    {
      id: "p-tissue",
      categoryId: "c-life",
      name: "티슈",
      isConsumable: true,
    },
    {
      id: "p-a4",
      categoryId: "c-office",
      name: "A4 용지",
      isConsumable: true,
    },
    {
      id: "p-battery",
      categoryId: "c-electronics",
      name: "건전지",
      isConsumable: true,
    },
  ],
  variants: [
    {
      id: "v-milk-500",
      productId: "p-milk",
      unitId: "u-bottle",
      quantityPerUnit: 500,
      name: "500ml",
      isDefault: true,
    },
    {
      id: "v-milk-1l",
      productId: "p-milk",
      unitId: "u-bottle",
      quantityPerUnit: 1000,
      name: "1L",
    },
    {
      id: "v-ramen-1",
      productId: "p-ramen",
      unitId: "u-ea",
      quantityPerUnit: 1,
      name: "1봉",
      isDefault: true,
    },
    {
      id: "v-ramen-5",
      productId: "p-ramen",
      unitId: "u-pack",
      quantityPerUnit: 5,
      name: "5개입",
    },
    {
      id: "v-tissue-box",
      productId: "p-tissue",
      unitId: "u-box",
      quantityPerUnit: 1,
      name: "1박스",
      isDefault: true,
    },
    {
      id: "v-a4-ream",
      productId: "p-a4",
      unitId: "u-ream",
      quantityPerUnit: 1,
      name: "1권",
      isDefault: true,
    },
    {
      id: "v-battery-aaa",
      productId: "p-battery",
      unitId: "u-pack",
      quantityPerUnit: 4,
      name: "AAA 4입",
      isDefault: true,
    },
  ],
};

export function cloneDefaultCatalog(): ProductCatalog {
  return structuredClone(DEFAULT_PRODUCT_CATALOG);
}

/** 거점에 catalog가 없으면 기본값을 붙인다 (로컬·mock 호환). */
export function ensureHouseholdCatalog(h: Household): Household {
  if (h.catalog) return h;
  return { ...h, catalog: cloneDefaultCatalog() };
}

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
