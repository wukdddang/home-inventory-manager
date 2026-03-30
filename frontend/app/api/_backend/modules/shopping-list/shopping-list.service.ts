import { BaseService, ServiceResponse } from '../../common/base.service';
import { SHOPPING_LIST_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface CreateShoppingListItemRequest {
  categoryId?: string;
  productId?: string;
  productVariantId?: string;
  sourceInventoryItemId?: string;
  targetStorageLocationId?: string;
  quantity?: number;
  sortOrder?: number;
  memo?: string;
}

export interface UpdateShoppingListItemRequest {
  categoryId?: string;
  productId?: string;
  productVariantId?: string;
  sourceInventoryItemId?: string;
  targetStorageLocationId?: string;
  quantity?: number;
  sortOrder?: number;
  memo?: string;
}

export interface CompleteShoppingListItemRequest {
  inventoryItemId: string;
  quantity: number;
  memo?: string;
}

// ── Response DTOs ──
export interface ShoppingListItem {
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
  createdAt: string;
  updatedAt: string;
}

export class ShoppingListService extends BaseService {
  async 장보기_항목_목록을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<ShoppingListItem[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        SHOPPING_LIST_ENDPOINTS.목록_및_생성(householdId),
        { method: 'GET', headers: this.authHeaders() },
      );
      if (!res.ok) await this.parseErrorResponse(res, '장보기 항목 목록 조회에 실패했습니다.');
      return res.json();
    }, '장보기 항목 목록 조회에 실패했습니다.');
  }

  async 장보기_항목을_추가한다(
    householdId: string,
    body: CreateShoppingListItemRequest,
  ): Promise<ServiceResponse<ShoppingListItem>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        SHOPPING_LIST_ENDPOINTS.목록_및_생성(householdId),
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '장보기 항목 추가에 실패했습니다.');
      return res.json();
    }, '장보기 항목 추가에 실패했습니다.');
  }

  async 장보기_항목을_수정한다(
    householdId: string,
    id: string,
    body: UpdateShoppingListItemRequest,
  ): Promise<ServiceResponse<ShoppingListItem>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        SHOPPING_LIST_ENDPOINTS.단건(householdId, id),
        {
          method: 'PUT',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '장보기 항목 수정에 실패했습니다.');
      return res.json();
    }, '장보기 항목 수정에 실패했습니다.');
  }

  async 장보기_항목을_삭제한다(
    householdId: string,
    id: string,
  ): Promise<ServiceResponse<void>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        SHOPPING_LIST_ENDPOINTS.단건(householdId, id),
        { method: 'DELETE', headers: this.authHeaders() },
      );
      if (!res.ok) await this.parseErrorResponse(res, '장보기 항목 삭제에 실패했습니다.');
    }, '장보기 항목 삭제에 실패했습니다.');
  }

  async 장보기_항목을_구매_완료_처리한다(
    householdId: string,
    id: string,
    body: CompleteShoppingListItemRequest,
  ): Promise<ServiceResponse<unknown>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        SHOPPING_LIST_ENDPOINTS.구매완료(householdId, id),
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '장보기 구매 완료 처리에 실패했습니다.');
      return res.json();
    }, '장보기 구매 완료 처리에 실패했습니다.');
  }
}
