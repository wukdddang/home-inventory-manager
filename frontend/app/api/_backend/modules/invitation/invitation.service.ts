import { BaseService, ServiceResponse } from '../../common/base.service';
import { INVITATION_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface CreateInvitationRequest {
  role: 'admin' | 'editor' | 'viewer';
  inviteeEmail?: string;
  expiresInDays?: number;
}

// ── Response DTOs ──
export interface Invitation {
  id: string;
  householdId: string;
  householdName: string;
  invitedByUserId: string;
  invitedByDisplayName: string;
  role: string;
  token: string;
  status: string;
  inviteeEmail: string | null;
  acceptedByUserId: string | null;
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export class InvitationService extends BaseService {
  async 초대를_생성한다(
    householdId: string,
    body: CreateInvitationRequest,
  ): Promise<ServiceResponse<Invitation>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        INVITATION_ENDPOINTS.목록_및_생성(householdId),
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '초대 생성에 실패했습니다.');
      return res.json();
    }, '초대 생성에 실패했습니다.');
  }

  async 초대_목록을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<Invitation[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        INVITATION_ENDPOINTS.목록_및_생성(householdId),
        {
          method: 'GET',
          headers: this.authHeaders(),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '초대 목록 조회에 실패했습니다.');
      return res.json();
    }, '초대 목록 조회에 실패했습니다.');
  }

  async 초대를_취소한다(
    householdId: string,
    invitationId: string,
  ): Promise<ServiceResponse<void>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        INVITATION_ENDPOINTS.취소(householdId, invitationId),
        {
          method: 'DELETE',
          headers: this.authHeaders(),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '초대 취소에 실패했습니다.');
    }, '초대 취소에 실패했습니다.');
  }

  async 초대를_토큰으로_조회한다(
    token: string,
  ): Promise<ServiceResponse<Invitation>> {
    return this.handleApiCall(async () => {
      const res = await fetch(INVITATION_ENDPOINTS.토큰조회(token), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) await this.parseErrorResponse(res, '초대 조회에 실패했습니다.');
      return res.json();
    }, '초대 조회에 실패했습니다.');
  }

  async 초대를_수락한다(
    token: string,
  ): Promise<ServiceResponse<{ message: string }>> {
    return this.handleApiCall(async () => {
      const res = await fetch(INVITATION_ENDPOINTS.토큰수락(token), {
        method: 'POST',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '초대 수락에 실패했습니다.');
      return res.json();
    }, '초대 수락에 실패했습니다.');
  }
}
