import { Module } from '@nestjs/common';
import { HouseholdBusinessModule } from '../../business/household-business/household-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { HouseholdController } from './household.controller';

@Module({
  imports: [HouseholdBusinessModule, HouseholdMemberModule],
  controllers: [HouseholdController],
})
export class HouseholdInterfaceModule {}
