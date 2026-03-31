import type { ShoppingListEntry } from "@/types/domain";
import { getShoppingList, setShoppingList } from "@/lib/local-store";

// ── Response DTO ──────────────────────────────────────────────────────────────

export interface ApiShoppingListItem {
  id: string;
  householdId: string;
  inventoryItemId: string | null;
  label: string | null;
  unit: string | null;
  variantCaption: string | null;
  categoryId: string | null;
  productId: string | null;
  productVariantId: string | null;
  restockQuantity: number;
  targetStorageLocationId: string | null;
  createdAt: string;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

export function mapApiToShoppingEntry(
  item: ApiShoppingListItem,
): ShoppingListEntry {
  return {
    id: item.id,
    householdId: item.householdId,
    inventoryItemId: item.inventoryItemId,
    label: item.label ?? undefined,
    unit: item.unit ?? undefined,
    variantCaption: item.variantCaption ?? undefined,
    categoryId: item.categoryId ?? undefined,
    productId: item.productId ?? undefined,
    productVariantId: item.productVariantId ?? undefined,
    restockQuantity: item.restockQuantity,
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
