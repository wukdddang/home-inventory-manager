// ── Command DTOs ──

export class CreatePurchaseData {
  householdId: string;
  inventoryItemId?: string | null;
  unitPrice: number;
  purchasedAt: Date;
  supplierName?: string | null;
  itemName?: string | null;
  variantCaption?: string | null;
  unitSymbol?: string | null;
  memo?: string | null;
  userId?: string | null;
  batches: CreatePurchaseBatchData[];
}

export class CreatePurchaseBatchData {
  quantity: number;
  expirationDate?: string | null;
}

export class LinkPurchaseInventoryData {
  inventoryItemId: string;
}

// ── Result DTOs ──

export class PurchaseBatchResult {
  id: string;
  purchaseId: string;
  quantity: number;
  expirationDate: string | null;
  createdAt: Date;
}

export class PurchaseResult {
  id: string;
  householdId: string;
  inventoryItemId: string | null;
  unitPrice: number;
  purchasedAt: Date;
  supplierName: string | null;
  itemName: string | null;
  variantCaption: string | null;
  unitSymbol: string | null;
  memo: string | null;
  userId: string | null;
  batches?: PurchaseBatchResult[];
  createdAt: Date;
}
