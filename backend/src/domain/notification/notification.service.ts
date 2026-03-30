import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async 알림_목록을_조회한다(
    userId: string,
    householdId?: string,
  ): Promise<Notification[]> {
    const where: any = { userId };
    if (householdId) {
      where.householdId = householdId;
    }
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async 알림을_생성한다(data: {
    userId: string;
    householdId?: string | null;
    type: string;
    title: string;
    body?: string | null;
    refType?: string | null;
    refId?: string | null;
  }): Promise<Notification> {
    const notification = this.repo.create(data);
    return this.repo.save(notification);
  }

  async 알림을_읽음_처리한다(
    id: string,
    userId: string,
  ): Promise<Notification | null> {
    const result = await this.repo.update(
      { id, userId },
      { readAt: new Date() },
    );
    if ((result.affected ?? 0) === 0) return null;
    return this.repo.findOne({ where: { id, userId } });
  }
}
