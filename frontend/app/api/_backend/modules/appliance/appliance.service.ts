import { BaseService, ServiceResponse } from '../../common/base.service';
import { APPLIANCE_ENDPOINTS } from '../../api-endpoints';

export class ApplianceService extends BaseService {
  // ── 가전 ──

  async 가전_목록을_조회한다(
    householdId: string,
    status?: string,
  ): Promise<ServiceResponse<unknown[]>> {
    return this.handleApiCall(async () => {
      const url = new URL(APPLIANCE_ENDPOINTS.목록_및_생성(householdId));
      if (status) url.searchParams.set('status', status);
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '가전 목록 조회에 실패했습니다.');
      return res.json();
    }, '가전 목록 조회에 실패했습니다.');
  }

  async 가전을_단건_조회한다(
    householdId: string,
    appId: string,
  ): Promise<ServiceResponse<unknown>> {
    return this.handleApiCall(async () => {
      const res = await fetch(APPLIANCE_ENDPOINTS.단건(householdId, appId), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '가전 조회에 실패했습니다.');
      return res.json();
    }, '가전 조회에 실패했습니다.');
  }

  async 가전을_생성한다(
    householdId: string,
    data: Record<string, unknown>,
  ): Promise<ServiceResponse<unknown>> {
    return this.handleApiCall(async () => {
      const res = await fetch(APPLIANCE_ENDPOINTS.목록_및_생성(householdId), {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) await this.parseErrorResponse(res, '가전 생성에 실패했습니다.');
      return res.json();
    }, '가전 생성에 실패했습니다.');
  }

  async 가전을_수정한다(
    householdId: string,
    appId: string,
    data: Record<string, unknown>,
  ): Promise<ServiceResponse<unknown>> {
    return this.handleApiCall(async () => {
      const res = await fetch(APPLIANCE_ENDPOINTS.단건(householdId, appId), {
        method: 'PUT',
        headers: this.authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) await this.parseErrorResponse(res, '가전 수정에 실패했습니다.');
      return res.json();
    }, '가전 수정에 실패했습니다.');
  }

  async 가전을_폐기한다(
    householdId: string,
    appId: string,
  ): Promise<ServiceResponse<unknown>> {
    return this.handleApiCall(async () => {
      const res = await fetch(APPLIANCE_ENDPOINTS.폐기(householdId, appId), {
        method: 'PATCH',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '가전 폐기에 실패했습니다.');
      return res.json();
    }, '가전 폐기에 실패했습니다.');
  }

  // ── 유지보수 스케줄 ──

  async 스케줄_목록을_조회한다(
    householdId: string,
    appId: string,
  ): Promise<ServiceResponse<unknown[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        APPLIANCE_ENDPOINTS.스케줄_목록_및_생성(householdId, appId),
        {
          method: 'GET',
          headers: this.authHeaders(),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '스케줄 목록 조회에 실패했습니다.');
      return res.json();
    }, '스케줄 목록 조회에 실패했습니다.');
  }

  async 스케줄을_생성한다(
    householdId: string,
    appId: string,
    data: Record<string, unknown>,
  ): Promise<ServiceResponse<unknown>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        APPLIANCE_ENDPOINTS.스케줄_목록_및_생성(householdId, appId),
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '스케줄 생성에 실패했습니다.');
      return res.json();
    }, '스케줄 생성에 실패했습니다.');
  }

  async 스케줄을_수정한다(
    householdId: string,
    appId: string,
    schedId: string,
    data: Record<string, unknown>,
  ): Promise<ServiceResponse<unknown>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        APPLIANCE_ENDPOINTS.스케줄_단건(householdId, appId, schedId),
        {
          method: 'PUT',
          headers: this.authHeaders(),
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '스케줄 수정에 실패했습니다.');
      return res.json();
    }, '스케줄 수정에 실패했습니다.');
  }

  async 스케줄을_비활성화한다(
    householdId: string,
    appId: string,
    schedId: string,
  ): Promise<ServiceResponse<unknown>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        APPLIANCE_ENDPOINTS.스케줄_비활성화(householdId, appId, schedId),
        {
          method: 'PATCH',
          headers: this.authHeaders(),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '스케줄 비활성화에 실패했습니다.');
      return res.json();
    }, '스케줄 비활성화에 실패했습니다.');
  }

  // ── 유지보수 이력 ──

  async 이력_목록을_조회한다(
    householdId: string,
    appId: string,
    type?: string,
  ): Promise<ServiceResponse<unknown[]>> {
    return this.handleApiCall(async () => {
      const url = new URL(
        APPLIANCE_ENDPOINTS.이력_목록_및_생성(householdId, appId),
      );
      if (type) url.searchParams.set('type', type);
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '유지보수 이력 조회에 실패했습니다.');
      return res.json();
    }, '유지보수 이력 조회에 실패했습니다.');
  }

  async 이력을_생성한다(
    householdId: string,
    appId: string,
    data: Record<string, unknown>,
  ): Promise<ServiceResponse<unknown>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        APPLIANCE_ENDPOINTS.이력_목록_및_생성(householdId, appId),
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '유지보수 이력 생성에 실패했습니다.');
      return res.json();
    }, '유지보수 이력 생성에 실패했습니다.');
  }
}
