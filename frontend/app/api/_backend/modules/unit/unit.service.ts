import { BaseService, ServiceResponse } from '../../common/base.service';
import { UNIT_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface CreateUnitRequest {
  symbol: string;
  name?: string;
  sortOrder?: number;
}

export interface UpdateUnitRequest {
  symbol?: string;
  name?: string;
  sortOrder?: number;
}

export interface CopyUnitsRequest {
  sourceHouseholdId: string;
}

// ── Response DTOs ──
export interface Unit {
  id: string;
  householdId: string;
  symbol: string;
  name: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export class UnitService extends BaseService {
  async 단위_목록을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<Unit[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(UNIT_ENDPOINTS.목록_및_생성(householdId), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '단위 목록 조회에 실패했습니다.');
      return res.json();
    }, '단위 목록 조회에 실패했습니다.');
  }

  async 단위를_단건_조회한다(
    householdId: string,
    id: string,
  ): Promise<ServiceResponse<Unit>> {
    return this.handleApiCall(async () => {
      const res = await fetch(UNIT_ENDPOINTS.단건(householdId, id), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '단위 조회에 실패했습니다.');
      return res.json();
    }, '단위 조회에 실패했습니다.');
  }

  async 단위를_생성한다(
    householdId: string,
    body: CreateUnitRequest,
  ): Promise<ServiceResponse<Unit>> {
    return this.handleApiCall(async () => {
      const res = await fetch(UNIT_ENDPOINTS.목록_및_생성(householdId), {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '단위 생성에 실패했습니다.');
      return res.json();
    }, '단위 생성에 실패했습니다.');
  }

  async 단위를_수정한다(
    householdId: string,
    id: string,
    body: UpdateUnitRequest,
  ): Promise<ServiceResponse<Unit>> {
    return this.handleApiCall(async () => {
      const res = await fetch(UNIT_ENDPOINTS.단건(householdId, id), {
        method: 'PUT',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '단위 수정에 실패했습니다.');
      return res.json();
    }, '단위 수정에 실패했습니다.');
  }

  async 단위를_삭제한다(
    householdId: string,
    id: string,
  ): Promise<ServiceResponse<void>> {
    return this.handleApiCall(async () => {
      const res = await fetch(UNIT_ENDPOINTS.단건(householdId, id), {
        method: 'DELETE',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '단위 삭제에 실패했습니다.');
    }, '단위 삭제에 실패했습니다.');
  }

  async 다른_거점에서_단위를_가져온다(
    householdId: string,
    body: CopyUnitsRequest,
  ): Promise<ServiceResponse<Unit[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(UNIT_ENDPOINTS.복사(householdId), {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '단위 가져오기에 실패했습니다.');
      return res.json();
    }, '단위 가져오기에 실패했습니다.');
  }
}
