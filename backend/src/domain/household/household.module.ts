import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Household } from './household.entity';
import { HouseholdService } from './household.service';

@Module({
  imports: [TypeOrmModule.forFeature([Household])],
  providers: [HouseholdService],
  exports: [HouseholdService],
})
export class HouseholdModule {}
