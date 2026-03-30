import { Module } from '@nestjs/common';
import { NotificationBusinessModule } from '../../business/notification-business/notification-business.module';
import { NotificationController } from './notification.controller';

@Module({
  imports: [NotificationBusinessModule],
  controllers: [NotificationController],
})
export class NotificationInterfaceModule {}
