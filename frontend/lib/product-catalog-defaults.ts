/**
 * 논리 설계 Category / Product / ProductVariant / Unit 에 맞춘 로컬 카탈로그 기본값.
 * 앱 전역 공통 카탈로그(`him-product-catalog` 등)의 시드로 사용합니다.
 */
import type { InventoryRow, ProductCatalog } from "@/types/domain";

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
      imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=128&h=128&fit=crop&q=80",
    },
    {
      id: "p-ramen",
      categoryId: "c-food",
      name: "라면",
      isConsumable: true,
      imageUrl: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=128&h=128&fit=crop&q=80",
    },
    {
      id: "p-tissue",
      categoryId: "c-life",
      name: "티슈",
      isConsumable: true,
      imageUrl: "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=128&h=128&fit=crop&q=80",
    },
    {
      id: "p-a4",
      categoryId: "c-office",
      name: "A4 용지",
      isConsumable: true,
      imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=128&h=128&fit=crop&q=80",
    },
    {
      id: "p-battery",
      categoryId: "c-electronics",
      name: "건전지",
      isConsumable: true,
      imageUrl: "https://images.unsplash.com/photo-1619641805634-98e5c37150f1?w=128&h=128&fit=crop&q=80",
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
