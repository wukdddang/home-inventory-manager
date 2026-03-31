// ── Command DTOs ──

export class CreateInventoryItemData {
  productVariantId: string;
  storageLocationId: string;
  quantity?: number;
  minStockLevel?: number | null;
}

export class UpdateInventoryItemQuantityData {
  quantity: number;
}

// ── Result DTOs ──

export class InventoryItemResult {
  id: string;
  productVariantId: string;
  storageLocationId: string;
  quantity: number;
  minStockLevel: number | null;
  productVariant?: {
    id: string;
    name: string | null;
    quantityPerUnit: number;
    product?: {
      id: string;
      name: string;
      isConsumable: boolean;
    };
    unit?: {
      id: string;
      symbol: string;
      name: string;
    };
  };
  storageLocation?: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
