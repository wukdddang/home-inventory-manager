import { BaseService, ServiceResponse } from '../../common/base.service';
import { INVENTORY_ITEM_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface CreateInventoryItemRequest {
  productVariantId: string;
  storageLocationId: string;
  quantity?: number;
  minStockLevel?: number;
}

export interface UpdateInventoryItemQuantityRequest {
  quantity: number;
}

// ── Response DTOs ──
export interface InventoryItem {
  id: string;
  householdId: string;
  productVariantId: string;
  storageLocationId: string;
  quantity: number;
  minStockLevel: number | null;
  createdAt: string;
  updatedAt: string;
}

export class InventoryItemService extends BaseService {
  async 재고_품목_목록을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<InventoryItem[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        INVENTORY_ITEM_ENDPOINTS.목록_및_생성(householdId),
        { method: 'GET', headers: this.authHeaders() },
      );
      if (!res.ok) await this.parseErrorResponse(res, '재고 품목 목록 조회에 실패했습니다.');
      return res.json();
    }, '재고 품목 목록 조회에 실패했습니다.');
  }

  async 재고_품목을_등록한다(
    householdId: string,
    body: CreateInventoryItemRequest,
  ): Promise<ServiceResponse<InventoryItem>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        INVENTORY_ITEM_ENDPOINTS.목록_및_생성(householdId),
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '재고 품목 등록에 실패했습니다.');
      return res.json();
    }, '재고 품목 등록에 실패했습니다.');
  }

  async 재고_수량을_수정한다(
    householdId: string,
    id: string,
    body: UpdateInventoryItemQuantityRequest,
  ): Promise<ServiceResponse<InventoryItem>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        INVENTORY_ITEM_ENDPOINTS.수량수정(householdId, id),
        {
          method: 'PATCH',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '재고 수량 수정에 실패했습니다.');
      return res.json();
    }, '재고 수량 수정에 실패했습니다.');
  }
}
