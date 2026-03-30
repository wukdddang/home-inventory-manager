import { BaseService, ServiceResponse } from '../../common/base.service';
import { NOTIFICATION_PREFERENCE_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface SaveNotificationPreferenceRequest {
  householdId?: string;
  notifyExpiration?: boolean;
  notifyShopping?: boolean;
  notifyLowStock?: boolean;
  expirationDaysBefore?: number;
  expirationRuleScope?: string;
  notifyExpiredLots?: boolean;
  expirationSameDayReminder?: boolean;
  shoppingNotifyListUpdates?: boolean;
  shoppingTripReminder?: boolean;
  shoppingTripReminderWeekday?: number;
  lowStockRespectMinLevel?: boolean;
}

export interface UpdateNotificationPreferenceRequest {
  notifyExpiration?: boolean;
  notifyShopping?: boolean;
  notifyLowStock?: boolean;
  expirationDaysBefore?: number;
  expirationRuleScope?: string;
  notifyExpiredLots?: boolean;
  expirationSameDayReminder?: boolean;
  shoppingNotifyListUpdates?: boolean;
  shoppingTripReminder?: boolean;
  shoppingTripReminderWeekday?: number;
  lowStockRespectMinLevel?: boolean;
}

// ── Response DTOs ──
export interface NotificationPreference {
  id: string;
  userId: string;
  householdId: string | null;
  notifyExpiration: boolean;
  notifyShopping: boolean;
  notifyLowStock: boolean;
  expirationDaysBefore: number;
  expirationRuleScope: string | null;
  notifyExpiredLots: boolean;
  expirationSameDayReminder: boolean;
  shoppingNotifyListUpdates: boolean;
  shoppingTripReminder: boolean;
  shoppingTripReminderWeekday: number | null;
  lowStockRespectMinLevel: boolean;
  createdAt: string;
  updatedAt: string;
}

export class NotificationPreferenceService extends BaseService {
  async 알림_설정_목록을_조회한다(): Promise<
    ServiceResponse<NotificationPreference[]>
  > {
    return this.handleApiCall(async () => {
      const res = await fetch(NOTIFICATION_PREFERENCE_ENDPOINTS.목록_및_생성, {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '알림 설정 목록 조회에 실패했습니다.');
      return res.json();
    }, '알림 설정 목록 조회에 실패했습니다.');
  }

  async 알림_설정을_저장한다(
    body: SaveNotificationPreferenceRequest,
  ): Promise<ServiceResponse<NotificationPreference>> {
    return this.handleApiCall(async () => {
      const res = await fetch(NOTIFICATION_PREFERENCE_ENDPOINTS.목록_및_생성, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '알림 설정 저장에 실패했습니다.');
      return res.json();
    }, '알림 설정 저장에 실패했습니다.');
  }

  async 알림_설정을_수정한다(
    id: string,
    body: UpdateNotificationPreferenceRequest,
  ): Promise<ServiceResponse<NotificationPreference>> {
    return this.handleApiCall(async () => {
      const res = await fetch(NOTIFICATION_PREFERENCE_ENDPOINTS.단건(id), {
        method: 'PUT',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '알림 설정 수정에 실패했습니다.');
      return res.json();
    }, '알림 설정 수정에 실패했습니다.');
  }

  async 알림_설정을_삭제한다(
    id: string,
  ): Promise<ServiceResponse<void>> {
    return this.handleApiCall(async () => {
      const res = await fetch(NOTIFICATION_PREFERENCE_ENDPOINTS.단건(id), {
        method: 'DELETE',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '알림 설정 삭제에 실패했습니다.');
    }, '알림 설정 삭제에 실패했습니다.');
  }
}
