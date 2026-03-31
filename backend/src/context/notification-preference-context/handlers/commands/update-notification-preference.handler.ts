import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { NotificationPreferenceService } from '../../../../domain/notification-preference/notification-preference.service';
import { UpdateNotificationPreferenceData } from '../../interfaces/notification-preference-context.interface';

export class UpdateNotificationPreferenceCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly data: UpdateNotificationPreferenceData,
  ) {}
}

@CommandHandler(UpdateNotificationPreferenceCommand)
export class UpdateNotificationPreferenceHandler
  implements ICommandHandler<UpdateNotificationPreferenceCommand>
{
  constructor(
    private readonly service: NotificationPreferenceService,
  ) {}

  async execute(command: UpdateNotificationPreferenceCommand) {
    const result = await this.service.알림_설정을_수정한다(
      command.id,
      command.userId,
      command.data,
    );
    if (!result) {
      throw new NotFoundException('알림 설정을 찾을 수 없습니다.');
    }
    return result;
  }
}
