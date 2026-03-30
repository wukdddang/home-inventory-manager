import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotificationService } from '../../../../domain/notification/notification.service';

export class GetNotificationListQuery {
  constructor(
    public readonly userId: string,
    public readonly householdId?: string,
  ) {}
}

@QueryHandler(GetNotificationListQuery)
export class GetNotificationListHandler
  implements IQueryHandler<GetNotificationListQuery>
{
  constructor(private readonly notificationService: NotificationService) {}

  async execute(query: GetNotificationListQuery) {
    return this.notificationService.알림_목록을_조회한다(
      query.userId,
      query.householdId,
    );
  }
}
