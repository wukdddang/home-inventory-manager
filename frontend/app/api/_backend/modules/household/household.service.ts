import { BaseService, ServiceResponse } from '../../common/base.service';
import { HOUSEHOLD_ENDPOINTS, MEMBER_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface CreateHouseholdRequest {
  name: string;
  kind?: string;
}

export interface UpdateHouseholdRequest {
  name?: string;
  kind?: string;
}

export interface AddMemberRequest {
  userId: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface ChangeMemberRoleRequest {
  role: 'admin' | 'editor' | 'viewer';
}

// ── Response DTOs ──
export interface Household {
  id: string;
  name: string;
  kind: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
}

export class HouseholdService extends BaseService {
  async 거점을_생성한다(
    body: CreateHouseholdRequest,
  ): Promise<ServiceResponse<Household>> {
    return this.handleApiCall(async () => {
      const res = await fetch(HOUSEHOLD_ENDPOINTS.목록_및_생성, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '거점 생성에 실패했습니다.');
      return res.json();
    }, '거점 생성에 실패했습니다.');
  }

  async 거점_목록을_조회한다(): Promise<ServiceResponse<Household[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(HOUSEHOLD_ENDPOINTS.목록_및_생성, {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '거점 목록 조회에 실패했습니다.');
      return res.json();
    }, '거점 목록 조회에 실패했습니다.');
  }

  async 거점을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<Household>> {
    return this.handleApiCall(async () => {
      const res = await fetch(HOUSEHOLD_ENDPOINTS.단건(householdId), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '거점 조회에 실패했습니다.');
      return res.json();
    }, '거점 조회에 실패했습니다.');
  }

  async 거점을_수정한다(
    householdId: string,
    body: UpdateHouseholdRequest,
  ): Promise<ServiceResponse<Household>> {
    return this.handleApiCall(async () => {
      const res = await fetch(HOUSEHOLD_ENDPOINTS.단건(householdId), {
        method: 'PUT',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '거점 수정에 실패했습니다.');
      return res.json();
    }, '거점 수정에 실패했습니다.');
  }

  async 거점을_삭제한다(
    householdId: string,
  ): Promise<ServiceResponse<void>> {
    return this.handleApiCall(async () => {
      const res = await fetch(HOUSEHOLD_ENDPOINTS.단건(householdId), {
        method: 'DELETE',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '거점 삭제에 실패했습니다.');
    }, '거점 삭제에 실패했습니다.');
  }

  // ── Members ──

  async 멤버_목록을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<HouseholdMember[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(MEMBER_ENDPOINTS.목록_및_추가(householdId), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '멤버 목록 조회에 실패했습니다.');
      return res.json();
    }, '멤버 목록 조회에 실패했습니다.');
  }

  async 멤버를_추가한다(
    householdId: string,
    body: AddMemberRequest,
  ): Promise<ServiceResponse<HouseholdMember>> {
    return this.handleApiCall(async () => {
      const res = await fetch(MEMBER_ENDPOINTS.목록_및_추가(householdId), {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '멤버 추가에 실패했습니다.');
      return res.json();
    }, '멤버 추가에 실패했습니다.');
  }

  async 멤버_역할을_변경한다(
    householdId: string,
    memberId: string,
    body: ChangeMemberRoleRequest,
  ): Promise<ServiceResponse<{ message: string }>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        MEMBER_ENDPOINTS.역할변경(householdId, memberId),
        {
          method: 'PATCH',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '역할 변경에 실패했습니다.');
      return res.json();
    }, '역할 변경에 실패했습니다.');
  }

  async 멤버를_제거한다(
    householdId: string,
    memberId: string,
  ): Promise<ServiceResponse<void>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        MEMBER_ENDPOINTS.제거(householdId, memberId),
        {
          method: 'DELETE',
          headers: this.authHeaders(),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '멤버 제거에 실패했습니다.');
    }, '멤버 제거에 실패했습니다.');
  }
}
