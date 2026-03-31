import { BaseService, ServiceResponse } from '../../common/base.service';
import { PURCHASE_BATCH_ENDPOINTS } from '../../api-endpoints';

// ── Response DTOs ──
export interface PurchaseBatch {
  id: string;
  purchaseId: string;
  quantity: number;
  expirationDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export class PurchaseBatchService extends BaseService {
  async 로트_목록을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<PurchaseBatch[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(PURCHASE_BATCH_ENDPOINTS.목록(householdId), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '로트 목록 조회에 실패했습니다.');
      return res.json();
    }, '로트 목록 조회에 실패했습니다.');
  }

  async 유통기한_임박_목록을_조회한다(
    householdId: string,
    days?: number,
  ): Promise<ServiceResponse<PurchaseBatch[]>> {
    return this.handleApiCall(async () => {
      const url = new URL(PURCHASE_BATCH_ENDPOINTS.유통기한임박(householdId));
      if (days !== undefined) url.searchParams.set('days', String(days));
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '유통기한 임박 목록 조회에 실패했습니다.');
      return res.json();
    }, '유통기한 임박 목록 조회에 실패했습니다.');
  }

  async 만료된_목록을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<PurchaseBatch[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(PURCHASE_BATCH_ENDPOINTS.만료(householdId), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '만료 목록 조회에 실패했습니다.');
      return res.json();
    }, '만료 목록 조회에 실패했습니다.');
  }
}
