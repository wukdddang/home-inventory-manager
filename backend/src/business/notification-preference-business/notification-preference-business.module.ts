import { Module } from '@nestjs/common';
import { NotificationPreferenceContextModule } from '../../context/notification-preference-context/notification-preference-context.module';
import { NotificationPreferenceBusinessService } from './notification-preference-business.service';

@Module({
  imports: [NotificationPreferenceContextModule],
  providers: [NotificationPreferenceBusinessService],
  exports: [NotificationPreferenceBusinessService],
})
export class NotificationPreferenceBusinessModule {}
