import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationPreference } from './notification-preference.entity';
import { NotificationPreferenceService } from './notification-preference.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationPreference])],
  providers: [NotificationPreferenceService],
  exports: [NotificationPreferenceService],
})
export class NotificationPreferenceModule {}
