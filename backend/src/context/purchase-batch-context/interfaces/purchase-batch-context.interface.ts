// ── Result DTOs ──

export class PurchaseBatchWithPurchaseResult {
  id: string;
  purchaseId: string;
  quantity: number;
  expirationDate: string | null;
  purchase?: {
    id: string;
    householdId: string;
    itemName: string | null;
    variantCaption: string | null;
    unitSymbol: string | null;
    supplierName: string | null;
  };
  createdAt: Date;
}
