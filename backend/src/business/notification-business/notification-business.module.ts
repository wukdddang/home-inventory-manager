import { Module } from '@nestjs/common';
import { NotificationContextModule } from '../../context/notification-context/notification-context.module';
import { NotificationBusinessService } from './notification-business.service';

@Module({
  imports: [NotificationContextModule],
  providers: [NotificationBusinessService],
  exports: [NotificationBusinessService],
})
export class NotificationBusinessModule {}
