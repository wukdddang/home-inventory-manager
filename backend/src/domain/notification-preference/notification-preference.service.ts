import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { NotificationPreference } from './notification-preference.entity';

@Injectable()
export class NotificationPreferenceService {
  constructor(
    @InjectRepository(NotificationPreference)
    private readonly repo: Repository<NotificationPreference>,
  ) {}

  async 알림_설정_목록을_조회한다(
    userId: string,
  ): Promise<NotificationPreference[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async 알림_설정을_단건_조회한다(
    id: string,
    userId: string,
  ): Promise<NotificationPreference | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  async 기본_알림_설정을_조회한다(
    userId: string,
  ): Promise<NotificationPreference | null> {
    return this.repo.findOne({
      where: { userId, householdId: IsNull() },
    });
  }

  async 알림_설정을_저장한다(data: {
    userId: string;
    householdId?: string | null;
    notifyExpiration?: boolean;
    notifyShopping?: boolean;
    notifyLowStock?: boolean;
    expirationDaysBefore?: number | null;
    expirationRuleScope?: string | null;
    notifyExpiredLots?: boolean;
    expirationSameDayReminder?: boolean;
    shoppingNotifyListUpdates?: boolean;
    shoppingTripReminder?: boolean;
    shoppingTripReminderWeekday?: number | null;
    lowStockRespectMinLevel?: boolean;
  }): Promise<NotificationPreference> {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async 알림_설정을_수정한다(
    id: string,
    userId: string,
    data: Partial<{
      notifyExpiration: boolean;
      notifyShopping: boolean;
      notifyLowStock: boolean;
      expirationDaysBefore: number | null;
      expirationRuleScope: string | null;
      notifyExpiredLots: boolean;
      expirationSameDayReminder: boolean;
      shoppingNotifyListUpdates: boolean;
      shoppingTripReminder: boolean;
      shoppingTripReminderWeekday: number | null;
      lowStockRespectMinLevel: boolean;
    }>,
  ): Promise<NotificationPreference | null> {
    const result = await this.repo.update({ id, userId }, data);
    if ((result.affected ?? 0) === 0) return null;
    return this.repo.findOne({ where: { id, userId } });
  }

  async 알림_설정을_삭제한다(
    id: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.repo.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }
}
