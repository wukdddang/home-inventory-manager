import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database/database.module';
import { envValidationSchema } from './common/config/env-validation';
import { HouseholdModule } from './domain/household/household.module';
import { AuthInfrastructureModule } from './common/auth/auth-infrastructure.module';
import { CategoryInterfaceModule } from './interface/category/category.module';
import { AuthInterfaceModule } from './interface/auth/auth.module';

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
  ],
})
export class AppModule {}
