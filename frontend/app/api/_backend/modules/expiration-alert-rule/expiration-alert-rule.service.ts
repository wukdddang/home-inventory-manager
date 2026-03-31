import { BaseService, ServiceResponse } from '../../common/base.service';
import { EXPIRATION_ALERT_RULE_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface SaveExpirationAlertRuleRequest {
  productId: string;
  daysBefore: number;
  isActive?: boolean;
}

export interface UpdateExpirationAlertRuleRequest {
  daysBefore?: number;
  isActive?: boolean;
}

// ── Response DTOs ──
export interface ExpirationAlertRule {
  id: string;
  householdId: string;
  productId: string;
  daysBefore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ExpirationAlertRuleService extends BaseService {
  async 만료_알림_규칙_목록을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<ExpirationAlertRule[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        EXPIRATION_ALERT_RULE_ENDPOINTS.목록_및_생성(householdId),
        { method: 'GET', headers: this.authHeaders() },
      );
      if (!res.ok) await this.parseErrorResponse(res, '만료 알림 규칙 목록 조회에 실패했습니다.');
      return res.json();
    }, '만료 알림 규칙 목록 조회에 실패했습니다.');
  }

  async 만료_알림_규칙을_저장한다(
    householdId: string,
    body: SaveExpirationAlertRuleRequest,
  ): Promise<ServiceResponse<ExpirationAlertRule>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        EXPIRATION_ALERT_RULE_ENDPOINTS.목록_및_생성(householdId),
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '만료 알림 규칙 저장에 실패했습니다.');
      return res.json();
    }, '만료 알림 규칙 저장에 실패했습니다.');
  }

  async 만료_알림_규칙을_수정한다(
    householdId: string,
    id: string,
    body: UpdateExpirationAlertRuleRequest,
  ): Promise<ServiceResponse<ExpirationAlertRule>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        EXPIRATION_ALERT_RULE_ENDPOINTS.단건(householdId, id),
        {
          method: 'PUT',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '만료 알림 규칙 수정에 실패했습니다.');
      return res.json();
    }, '만료 알림 규칙 수정에 실패했습니다.');
  }

  async 만료_알림_규칙을_삭제한다(
    householdId: string,
    id: string,
  ): Promise<ServiceResponse<void>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        EXPIRATION_ALERT_RULE_ENDPOINTS.단건(householdId, id),
        { method: 'DELETE', headers: this.authHeaders() },
      );
      if (!res.ok) await this.parseErrorResponse(res, '만료 알림 규칙 삭제에 실패했습니다.');
    }, '만료 알림 규칙 삭제에 실패했습니다.');
  }
}
