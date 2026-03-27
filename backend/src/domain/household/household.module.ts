import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Household } from './household.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Household])],
  exports: [TypeOrmModule],
})
export class HouseholdModule {}
