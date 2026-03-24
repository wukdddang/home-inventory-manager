import { 구매목록에서_품목_로트_요약을_구한다 } from "@/lib/inventory-lot-from-purchases";
import type {
  Household,
  InventoryRow,
  NotificationDetailPreferences,
  PurchaseRecord,
  ShoppingListEntry,
} from "@/types/domain";

export type ShoppingSuggestionReason = "expiring_soon" | "low_stock";

export type ShoppingSuggestion = {
  item: InventoryRow;
  reasons: ShoppingSuggestionReason[];
  suggestedRestock: number;
  worstExpiryDays: number | null;
};

export function isInventoryItemOnShoppingList(
  list: ShoppingListEntry[],
  householdId: string,
  item: InventoryRow,
): boolean {
  for (const e of list) {
    if (e.householdId !== householdId) continue;
    if (e.inventoryItemId === item.id) return true;
    if (
      item.productId &&
      item.productVariantId &&
      e.productId === item.productId &&
      e.productVariantId === item.productVariantId
    ) {
      return true;
    }
  }
  return false;
}

function defaultRestockForSuggestion(
  item: InventoryRow,
  reasons: ShoppingSuggestionReason[],
): number {
  if (reasons.includes("low_stock") && item.minStockLevel != null) {
    const gap = item.minStockLevel - item.quantity;
    if (gap > 0) return gap;
  }
  return 1;
}

/**
 * 재고·구매 로트·알림(유통기한 N일 전)·품목별 최소 재고를 바탕으로 장보기에 넣기 좋은 품목을 고릅니다.
 * 수량 0 품목은「재고 없음」자동 구역과 겹치므로 제외합니다.
 */
export function computeShoppingSuggestions(
  household: Household,
  purchases: PurchaseRecord[],
  shoppingList: ShoppingListEntry[],
  notificationDetail: NotificationDetailPreferences,
): ShoppingSuggestion[] {
  const threshold = Math.max(
    0,
    Math.floor(notificationDetail.expirationDaysBefore),
  );
  const out: ShoppingSuggestion[] = [];

  for (const item of household.items) {
    if (item.quantity < 1) continue;
    if (isInventoryItemOnShoppingList(shoppingList, household.id, item)) {
      continue;
    }

    const reasons: ShoppingSuggestionReason[] = [];
    const lot = 구매목록에서_품목_로트_요약을_구한다(
      purchases,
      household.id,
      item.id,
    );
    const expiring =
      lot.lotCount > 0 &&
      lot.worstExpiryDays !== null &&
      lot.worstExpiryDays <= threshold;
    if (expiring) reasons.push("expiring_soon");

    if (
      item.minStockLevel != null &&
      item.quantity < item.minStockLevel
    ) {
      reasons.push("low_stock");
    }

    if (reasons.length === 0) continue;

    out.push({
      item,
      reasons,
      suggestedRestock: defaultRestockForSuggestion(item, reasons),
      worstExpiryDays: lot.worstExpiryDays,
    });
  }

  out.sort((a, b) => {
    const ae = a.reasons.includes("expiring_soon");
    const be = b.reasons.includes("expiring_soon");
    if (ae && !be) return -1;
    if (!ae && be) return 1;
    if (ae && be) {
      const da = a.worstExpiryDays ?? 9999;
      const db = b.worstExpiryDays ?? 9999;
      if (da !== db) return da - db;
    }
    return a.item.name.localeCompare(b.item.name, "ko");
  });

  return out;
}
