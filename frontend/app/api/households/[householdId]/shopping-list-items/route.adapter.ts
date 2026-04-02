import type { ShoppingListEntry } from "@/types/domain";
import { getShoppingList, setShoppingList } from "@/lib/local-store";

// ── Response DTO ──────────────────────────────────────────────────────────────

/**
 * 백엔드가 반환하는 장보기 항목 DTO.
 *
 * 백엔드 필드명 → 프론트엔드 필드명 매핑:
 *   memo                  → label
 *   sourceInventoryItemId → inventoryItemId
 *   quantity              → restockQuantity
 *   product?.name         → (label 파생)
 *   productVariant?.name  → variantCaption
 */
export interface ApiShoppingListItem {
  id: string;
  householdId: string;
  // 백엔드 필드��
  sourceInventoryItemId?: string | null;
  memo?: string | null;
  quantity?: number | null;
  // 프론트엔드 기대 필드명 (하위 호환)
  inventoryItemId?: string | null;
  label?: string | null;
  unit?: string | null;
  variantCaption?: string | null;
  restockQuantity?: number;
  // ��통
  categoryId: string | null;
  productId: string | null;
  productVariantId: string | null;
  targetStorageLocationId: string | null;
  createdAt: string;
  // 백엔드 relations (eager-loaded)
  product?: { id: string; name: string } | null;
  productVariant?: {
    id: string;
    name: string | null;
    unit?: { id: string; symbol: string } | null;
  } | null;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

export function mapApiToShoppingEntry(
  item: ApiShoppingListItem,
): ShoppingListEntry {
  // 백엔드 필드명 → 프론트엔드 필드명 매핑 (양쪽 모두 지원)
  const label =
    item.label ?? item.memo ?? item.product?.name ?? undefined;
  const inventoryItemId =
    item.inventoryItemId ?? item.sourceInventoryItemId ?? null;
  const rawQty = item.restockQuantity ?? item.quantity;
  const restockQuantity =
    rawQty != null ? Number(rawQty) || 1 : 1;
  const unit =
    item.unit ?? item.productVariant?.unit?.symbol ?? undefined;
  const variantCaption =
    item.variantCaption ?? item.productVariant?.name ?? undefined;

  return {
    id: item.id,
    householdId: item.householdId,
    inventoryItemId,
    label,
    unit,
    variantCaption,
    categoryId: item.categoryId ?? undefined,
    productId: item.productId ?? undefined,
    productVariantId: item.productVariantId ?? undefined,
    restockQuantity,
    targetStorageLocationId: item.targetStorageLocationId ?? undefined,
    createdAt: item.createdAt,
  };
}

// ── Client helpers ────────────────────────────────────────────────────────────

export async function shoppingApiFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as {
    success: boolean;
    data: T;
    message?: string;
  };
  if (!json.success) throw new Error(json.message ?? "API 오류");
  return json.data;
}

/**
 * API에서 거점의 장보기 목록을 불러와 localStorage와 동기화한다.
 * 다른 거점 항목은 유지된다.
 */
export async function syncShoppingListFromApi(
  householdId: string,
): Promise<void> {
  const items = await shoppingApiFetch<ApiShoppingListItem[]>(
    `/api/households/${householdId}/shopping-list-items`,
  );
  const apiEntries = items.map(mapApiToShoppingEntry);
  const local = getShoppingList();
  const otherHouseholds = local.filter((e) => e.householdId !== householdId);
  setShoppingList([...otherHouseholds, ...apiEntries]);
}
