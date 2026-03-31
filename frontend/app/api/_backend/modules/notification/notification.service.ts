import { BaseService, ServiceResponse } from '../../common/base.service';
import { NOTIFICATION_ENDPOINTS } from '../../api-endpoints';

// ── Response DTOs ──
export interface Notification {
  id: string;
  userId: string;
  householdId: string | null;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export class NotificationService extends BaseService {
  async 알림_목록을_조회한다(
    householdId?: string,
  ): Promise<ServiceResponse<Notification[]>> {
    return this.handleApiCall(async () => {
      const url = new URL(NOTIFICATION_ENDPOINTS.목록);
      if (householdId) url.searchParams.set('householdId', householdId);
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '알림 목록 조회에 실패했습니다.');
      return res.json();
    }, '알림 목록 조회에 실패했습니다.');
  }

  async 알림을_읽음_처리한다(
    id: string,
  ): Promise<ServiceResponse<void>> {
    return this.handleApiCall(async () => {
      const res = await fetch(NOTIFICATION_ENDPOINTS.읽음(id), {
        method: 'PATCH',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '알림 읽음 처리에 실패했습니다.');
    }, '알림 읽음 처리에 실패했습니다.');
  }
}
