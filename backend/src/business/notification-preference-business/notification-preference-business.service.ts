import { Injectable } from '@nestjs/common';
import { NotificationPreferenceContextService } from '../../context/notification-preference-context/notification-preference-context.service';
import {
  SaveNotificationPreferenceData,
  UpdateNotificationPreferenceData,
  NotificationPreferenceResult,
} from '../../context/notification-preference-context/interfaces/notification-preference-context.interface';

@Injectable()
export class NotificationPreferenceBusinessService {
  constructor(
    private readonly contextService: NotificationPreferenceContextService,
  ) {}

  async 알림_설정_목록을_조회한다(
    userId: string,
  ): Promise<NotificationPreferenceResult[]> {
    return this.contextService.알림_설정_목록을_조회한다(userId);
  }

  async 알림_설정을_저장한다(
    data: SaveNotificationPreferenceData,
  ): Promise<NotificationPreferenceResult> {
    return this.contextService.알림_설정을_저장한다(data);
  }

  async 알림_설정을_수정한다(
    id: string,
    userId: string,
    data: UpdateNotificationPreferenceData,
  ): Promise<NotificationPreferenceResult> {
    return this.contextService.알림_설정을_수정한다(id, userId, data);
  }

  async 알림_설정을_삭제한다(
    id: string,
    userId: string,
  ): Promise<void> {
    return this.contextService.알림_설정을_삭제한다(id, userId);
  }
}
