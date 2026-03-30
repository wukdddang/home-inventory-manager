import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from '../../../../domain/notification/notification.service';

export class MarkNotificationReadCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(MarkNotificationReadCommand)
export class MarkNotificationReadHandler
  implements ICommandHandler<MarkNotificationReadCommand>
{
  constructor(private readonly notificationService: NotificationService) {}

  async execute(command: MarkNotificationReadCommand) {
    const result = await this.notificationService.알림을_읽음_처리한다(
      command.id,
      command.userId,
    );
    if (!result) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }
    return result;
  }
}
