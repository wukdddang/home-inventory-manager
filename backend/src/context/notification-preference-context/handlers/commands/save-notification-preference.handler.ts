import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotificationPreferenceService } from '../../../../domain/notification-preference/notification-preference.service';
import { SaveNotificationPreferenceData } from '../../interfaces/notification-preference-context.interface';

export class SaveNotificationPreferenceCommand {
  constructor(public readonly data: SaveNotificationPreferenceData) {}
}

@CommandHandler(SaveNotificationPreferenceCommand)
export class SaveNotificationPreferenceHandler
  implements ICommandHandler<SaveNotificationPreferenceCommand>
{
  constructor(
    private readonly service: NotificationPreferenceService,
  ) {}

  async execute(command: SaveNotificationPreferenceCommand) {
    return this.service.알림_설정을_저장한다(command.data);
  }
}
