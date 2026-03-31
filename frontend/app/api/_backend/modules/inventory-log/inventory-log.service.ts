import { BaseService, ServiceResponse } from '../../common/base.service';
import { INVENTORY_LOG_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface ConsumptionRequest {
  quantity: number;
  memo?: string;
}

export interface WasteRequest {
  quantity: number;
  reason?: string;
  memo?: string;
}

export interface AdjustmentRequest {
  quantityDelta: number;
  memo?: string;
}

// ── Response DTOs ──
export interface InventoryLog {
  id: string;
  inventoryItemId: string;
  type: string;
  quantity: number;
  memo: string | null;
  createdAt: string;
}

export class InventoryLogService extends BaseService {
  async 재고_이력_목록을_조회한다(
    householdId: string,
    inventoryItemId: string,
    from?: string,
    to?: string,
  ): Promise<ServiceResponse<InventoryLog[]>> {
    return this.handleApiCall(async () => {
      const url = new URL(
        INVENTORY_LOG_ENDPOINTS.이력목록(householdId, inventoryItemId),
      );
      if (from) url.searchParams.set('from', from);
      if (to) url.searchParams.set('to', to);
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '재고 이력 조회에 실패했습니다.');
      return res.json();
    }, '재고 이력 조회에 실패했습니다.');
  }

  async 소비를_기록한다(
    householdId: string,
    inventoryItemId: string,
    body: ConsumptionRequest,
  ): Promise<ServiceResponse<InventoryLog>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        INVENTORY_LOG_ENDPOINTS.소비(householdId, inventoryItemId),
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '소비 기록에 실패했습니다.');
      return res.json();
    }, '소비 기록에 실패했습니다.');
  }

  async 폐기를_기록한다(
    householdId: string,
    inventoryItemId: string,
    body: WasteRequest,
  ): Promise<ServiceResponse<InventoryLog>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        INVENTORY_LOG_ENDPOINTS.폐기(householdId, inventoryItemId),
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '폐기 기록에 실패했습니다.');
      return res.json();
    }, '폐기 기록에 실패했습니다.');
  }

  async 수량을_수동_조정한다(
    householdId: string,
    inventoryItemId: string,
    body: AdjustmentRequest,
  ): Promise<ServiceResponse<InventoryLog>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        INVENTORY_LOG_ENDPOINTS.조정(householdId, inventoryItemId),
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '수량 조정에 실패했습니다.');
      return res.json();
    }, '수량 조정에 실패했습니다.');
  }
}
