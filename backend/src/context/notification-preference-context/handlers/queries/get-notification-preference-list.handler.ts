import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotificationPreferenceService } from '../../../../domain/notification-preference/notification-preference.service';

export class GetNotificationPreferenceListQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetNotificationPreferenceListQuery)
export class GetNotificationPreferenceListHandler
  implements IQueryHandler<GetNotificationPreferenceListQuery>
{
  constructor(
    private readonly service: NotificationPreferenceService,
  ) {}

  async execute(query: GetNotificationPreferenceListQuery) {
    return this.service.알림_설정_목록을_조회한다(query.userId);
  }
}
