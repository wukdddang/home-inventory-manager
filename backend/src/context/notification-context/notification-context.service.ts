import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { NotificationResult } from './interfaces/notification-context.interface';
import { GetNotificationListQuery } from './handlers/queries/get-notification-list.handler';
import { MarkNotificationReadCommand } from './handlers/commands/mark-notification-read.handler';

@Injectable()
export class NotificationContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async 알림_목록을_조회한다(
    userId: string,
    householdId?: string,
  ): Promise<NotificationResult[]> {
    return this.queryBus.execute(
      new GetNotificationListQuery(userId, householdId),
    );
  }

  async 알림을_읽음_처리한다(
    id: string,
    userId: string,
  ): Promise<NotificationResult> {
    return this.commandBus.execute(
      new MarkNotificationReadCommand(id, userId),
    );
  }
}
