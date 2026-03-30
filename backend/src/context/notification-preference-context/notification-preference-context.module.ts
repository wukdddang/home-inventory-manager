import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NotificationPreferenceModule } from '../../domain/notification-preference/notification-preference.module';
import { NotificationPreferenceContextService } from './notification-preference-context.service';
import { SaveNotificationPreferenceHandler } from './handlers/commands/save-notification-preference.handler';
import { UpdateNotificationPreferenceHandler } from './handlers/commands/update-notification-preference.handler';
import { DeleteNotificationPreferenceHandler } from './handlers/commands/delete-notification-preference.handler';
import { GetNotificationPreferenceListHandler } from './handlers/queries/get-notification-preference-list.handler';

const CommandHandlers = [
  SaveNotificationPreferenceHandler,
  UpdateNotificationPreferenceHandler,
  DeleteNotificationPreferenceHandler,
];

const QueryHandlers = [GetNotificationPreferenceListHandler];

@Module({
  imports: [CqrsModule, NotificationPreferenceModule],
  providers: [
    NotificationPreferenceContextService,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [NotificationPreferenceContextService],
})
export class NotificationPreferenceContextModule {}
