import { BaseService, ServiceResponse } from '../../common/base.service';
import { HOUSEHOLD_KIND_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface SaveHouseholdKindRequest {
  items: {
    kindId: string;
    label: string;
    sortOrder: number;
  }[];
}

// ── Response DTOs ──
export interface HouseholdKindDefinition {
  id: string;
  kindId: string;
  label: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export class HouseholdKindService extends BaseService {
  async 거점유형_목록을_조회한다(): Promise<
    ServiceResponse<HouseholdKindDefinition[]>
  > {
    return this.handleApiCall(async () => {
      const res = await fetch(HOUSEHOLD_KIND_ENDPOINTS.목록_및_저장, {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok)
        await this.parseErrorResponse(res, '거점 유형 목록 조회에 실패했습니다.');
      return res.json();
    }, '거점 유형 목록 조회에 실패했습니다.');
  }

  async 거점유형을_저장한다(
    body: SaveHouseholdKindRequest,
  ): Promise<ServiceResponse<HouseholdKindDefinition[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(HOUSEHOLD_KIND_ENDPOINTS.목록_및_저장, {
        method: 'PUT',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok)
        await this.parseErrorResponse(res, '거점 유형 저장에 실패했습니다.');
      return res.json();
    }, '거점 유형 저장에 실패했습니다.');
  }
}
