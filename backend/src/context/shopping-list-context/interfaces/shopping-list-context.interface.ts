// ── Command DTOs ──

export class CreateShoppingListItemData {
  householdId: string;
  categoryId?: string | null;
  productId?: string | null;
  productVariantId?: string | null;
  sourceInventoryItemId?: string | null;
  targetStorageLocationId?: string | null;
  quantity?: number | null;
  sortOrder?: number;
  memo?: string | null;
}

export class UpdateShoppingListItemData {
  categoryId?: string | null;
  productId?: string | null;
  productVariantId?: string | null;
  sourceInventoryItemId?: string | null;
  targetStorageLocationId?: string | null;
  quantity?: number | null;
  sortOrder?: number;
  memo?: string | null;
}

export class CompleteShoppingListItemData {
  inventoryItemId: string;
  quantity: number;
  memo?: string | null;
}

// ── Result DTOs ──

export class ShoppingListItemResult {
  id: string;
  householdId: string;
  categoryId: string | null;
  productId: string | null;
  productVariantId: string | null;
  sourceInventoryItemId: string | null;
  targetStorageLocationId: string | null;
  quantity: number | null;
  sortOrder: number;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CompleteShoppingListItemResult {
  inventoryItem: { id: string; quantity: number };
  inventoryLog: {
    id: string;
    type: string;
    quantityDelta: number;
    quantityAfter: number;
  };
}
