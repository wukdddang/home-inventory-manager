// ── Command DTOs ──

export class CreateInventoryLogData {
  inventoryItemId: string;
  type: 'in' | 'out' | 'adjust' | 'waste';
  quantityDelta: number;
  reason?: string | null;
  userId?: string | null;
  memo?: string | null;
}

// ── Result DTOs ──

export class InventoryLogResult {
  id: string;
  inventoryItemId: string;
  type: string;
  quantityDelta: number;
  quantityAfter: number;
  reason: string | null;
  userId: string | null;
  itemLabel: string | null;
  memo: string | null;
  refType: string | null;
  refId: string | null;
  createdAt: Date;
}
