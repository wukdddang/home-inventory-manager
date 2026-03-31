import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { NotificationPreferenceService } from '../../../../domain/notification-preference/notification-preference.service';

export class DeleteNotificationPreferenceCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(DeleteNotificationPreferenceCommand)
export class DeleteNotificationPreferenceHandler
  implements ICommandHandler<DeleteNotificationPreferenceCommand>
{
  constructor(
    private readonly service: NotificationPreferenceService,
  ) {}

  async execute(command: DeleteNotificationPreferenceCommand): Promise<void> {
    const deleted = await this.service.알림_설정을_삭제한다(
      command.id,
      command.userId,
    );
    if (!deleted) {
      throw new NotFoundException('알림 설정을 찾을 수 없습니다.');
    }
  }
}
