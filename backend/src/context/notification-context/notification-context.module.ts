import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from '../../domain/notification/notification.module';
import { NotificationPreferenceModule } from '../../domain/notification-preference/notification-preference.module';
import { InventoryItemModule } from '../../domain/inventory-item/inventory-item.module';
import { PurchaseBatchModule } from '../../domain/purchase-batch/purchase-batch.module';
import { FcmContextModule } from '../fcm-context/fcm-context.module';
import { Household } from '../../domain/household/household.entity';
import { HouseholdMember } from '../../domain/household/household-member.entity';
import { NotificationContextService } from './notification-context.service';
import { NotificationScheduler } from './notification.scheduler';
import { GetNotificationListHandler } from './handlers/queries/get-notification-list.handler';
import { MarkNotificationReadHandler } from './handlers/commands/mark-notification-read.handler';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Household, HouseholdMember]),
    NotificationModule,
    NotificationPreferenceModule,
    InventoryItemModule,
    PurchaseBatchModule,
    FcmContextModule,
  ],
  providers: [
    NotificationContextService,
    NotificationScheduler,
    GetNotificationListHandler,
    MarkNotificationReadHandler,
  ],
  exports: [NotificationContextService, NotificationScheduler],
})
export class NotificationContextModule {}
