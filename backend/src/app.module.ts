import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { HouseholdModule } from './domain/household/household.module.js';
import { CategoryInterfaceModule } from './interface/category/category.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,

    // Domain
    HouseholdModule,

    // Interface (각 Interface 모듈이 Business → Context → Domain 의존성을 자체 포함)
    CategoryInterfaceModule,
  ],
})
export class AppModule {}
