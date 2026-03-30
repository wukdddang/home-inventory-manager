import { Module } from '@nestjs/common';
import { NotificationPreferenceBusinessModule } from '../../business/notification-preference-business/notification-preference-business.module';
import { NotificationPreferenceController } from './notification-preference.controller';

@Module({
  imports: [NotificationPreferenceBusinessModule],
  controllers: [NotificationPreferenceController],
})
export class NotificationPreferenceInterfaceModule {}
