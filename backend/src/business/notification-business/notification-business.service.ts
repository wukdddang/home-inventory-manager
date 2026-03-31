import { Injectable } from '@nestjs/common';
import { NotificationContextService } from '../../context/notification-context/notification-context.service';
import { NotificationResult } from '../../context/notification-context/interfaces/notification-context.interface';

@Injectable()
export class NotificationBusinessService {
  constructor(
    private readonly contextService: NotificationContextService,
  ) {}

  async 알림_목록을_조회한다(
    userId: string,
    householdId?: string,
  ): Promise<NotificationResult[]> {
    return this.contextService.알림_목록을_조회한다(userId, householdId);
  }

  async 알림을_읽음_처리한다(
    id: string,
    userId: string,
  ): Promise<NotificationResult> {
    return this.contextService.알림을_읽음_처리한다(id, userId);
  }
}
