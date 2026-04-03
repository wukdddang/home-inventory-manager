import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './common/database/database.module';
import { envValidationSchema } from './common/config/env-validation';
import { HouseholdModule } from './domain/household/household.module';
import { AuthInfrastructureModule } from './common/auth/auth-infrastructure.module';
import { CategoryInterfaceModule } from './interface/category/category.module';
import { AuthInterfaceModule } from './interface/auth/auth.module';
import { HouseholdInterfaceModule } from './interface/household/household.module';
import { InvitationInterfaceModule } from './interface/invitation/invitation.module';
import { HouseholdKindInterfaceModule } from './interface/household-kind/household-kind.module';
import { SpaceInterfaceModule } from './interface/space/space.module';
import { UnitInterfaceModule } from './interface/unit/unit.module';
import { ProductInterfaceModule } from './interface/product/product.module';
import { ProductVariantInterfaceModule } from './interface/product-variant/product-variant.module';
import { InventoryItemInterfaceModule } from './interface/inventory-item/inventory-item.module';
import { PurchaseInterfaceModule } from './interface/purchase/purchase.module';
import { PurchaseBatchInterfaceModule } from './interface/purchase-batch/purchase-batch.module';
import { InventoryLogInterfaceModule } from './interface/inventory-log/inventory-log.module';
import { ShoppingListInterfaceModule } from './interface/shopping-list/shopping-list.module';
import { NotificationPreferenceInterfaceModule } from './interface/notification-preference/notification-preference.module';
import { NotificationInterfaceModule } from './interface/notification/notification.module';
import { ExpirationAlertRuleInterfaceModule } from './interface/expiration-alert-rule/expiration-alert-rule.module';
import { FcmInterfaceModule } from './interface/fcm/fcm.module';
import { ApplianceInterfaceModule } from './interface/appliance/appliance.module';
import { AggregateInterfaceModule } from './interface/aggregate/aggregate.module';
import { BackupContextModule } from './context/backup-context';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: envValidationSchema,
        }),
        ScheduleModule.forRoot(),
        DatabaseModule,

        // Infrastructure
        AuthInfrastructureModule,

        // Domain
        HouseholdModule,

        // Interface (각 Interface 모듈이 Business → Context → Domain 의존성을 자체 포함)
        CategoryInterfaceModule,
        AuthInterfaceModule,
        HouseholdInterfaceModule,
        InvitationInterfaceModule,
        HouseholdKindInterfaceModule,
        SpaceInterfaceModule,
        UnitInterfaceModule,
        ProductInterfaceModule,
        ProductVariantInterfaceModule,
        InventoryItemInterfaceModule,
        PurchaseInterfaceModule,
        PurchaseBatchInterfaceModule,
        InventoryLogInterfaceModule,
        ShoppingListInterfaceModule,
        NotificationPreferenceInterfaceModule,
        NotificationInterfaceModule,
        ExpirationAlertRuleInterfaceModule,
        FcmInterfaceModule,
        ApplianceInterfaceModule,
        AggregateInterfaceModule,

        // Context
        BackupContextModule,
    ],
})
export class AppModule {}
