import { BaseService, ServiceResponse } from '../../common/base.service';
import { PURCHASE_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface CreatePurchaseBatchRequest {
  quantity: number;
  expirationDate?: string;
}

export interface CreatePurchaseRequest {
  inventoryItemId?: string;
  unitPrice: number;
  purchasedAt: string;
  supplierName?: string;
  itemName?: string;
  variantCaption?: string;
  unitSymbol?: string;
  memo?: string;
  batches: CreatePurchaseBatchRequest[];
}

export interface LinkPurchaseInventoryRequest {
  inventoryItemId: string;
}

// ── Response DTOs ──
export interface Purchase {
  id: string;
  householdId: string;
  inventoryItemId: string | null;
  unitPrice: number;
  purchasedAt: string;
  supplierName: string | null;
  itemName: string | null;
  variantCaption: string | null;
  unitSymbol: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export class PurchaseService extends BaseService {
  async 구매_목록을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<Purchase[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(PURCHASE_ENDPOINTS.목록_및_생성(householdId), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '구매 목록 조회에 실패했습니다.');
      return res.json();
    }, '구매 목록 조회에 실패했습니다.');
  }

  async 구매를_등록한다(
    householdId: string,
    body: CreatePurchaseRequest,
  ): Promise<ServiceResponse<Purchase>> {
    return this.handleApiCall(async () => {
      const res = await fetch(PURCHASE_ENDPOINTS.목록_및_생성(householdId), {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '구매 등록에 실패했습니다.');
      return res.json();
    }, '구매 등록에 실패했습니다.');
  }

  async 구매에_재고를_나중에_연결한다(
    householdId: string,
    id: string,
    body: LinkPurchaseInventoryRequest,
  ): Promise<ServiceResponse<Purchase>> {
    return this.handleApiCall(async () => {
      const res = await fetch(PURCHASE_ENDPOINTS.재고연결(householdId, id), {
        method: 'PATCH',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '구매-재고 연결에 실패했습니다.');
      return res.json();
    }, '구매-재고 연결에 실패했습니다.');
  }
}
