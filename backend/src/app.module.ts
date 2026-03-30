import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
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
  ],
})
export class AppModule {}
