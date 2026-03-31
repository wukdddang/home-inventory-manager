import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  SaveNotificationPreferenceData,
  UpdateNotificationPreferenceData,
  NotificationPreferenceResult,
} from './interfaces/notification-preference-context.interface';
import { SaveNotificationPreferenceCommand } from './handlers/commands/save-notification-preference.handler';
import { UpdateNotificationPreferenceCommand } from './handlers/commands/update-notification-preference.handler';
import { DeleteNotificationPreferenceCommand } from './handlers/commands/delete-notification-preference.handler';
import { GetNotificationPreferenceListQuery } from './handlers/queries/get-notification-preference-list.handler';

@Injectable()
export class NotificationPreferenceContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async 알림_설정_목록을_조회한다(
    userId: string,
  ): Promise<NotificationPreferenceResult[]> {
    return this.queryBus.execute(
      new GetNotificationPreferenceListQuery(userId),
    );
  }

  async 알림_설정을_저장한다(
    data: SaveNotificationPreferenceData,
  ): Promise<NotificationPreferenceResult> {
    return this.commandBus.execute(
      new SaveNotificationPreferenceCommand(data),
    );
  }

  async 알림_설정을_수정한다(
    id: string,
    userId: string,
    data: UpdateNotificationPreferenceData,
  ): Promise<NotificationPreferenceResult> {
    return this.commandBus.execute(
      new UpdateNotificationPreferenceCommand(id, userId, data),
    );
  }

  async 알림_설정을_삭제한다(
    id: string,
    userId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new DeleteNotificationPreferenceCommand(id, userId),
    );
  }
}
