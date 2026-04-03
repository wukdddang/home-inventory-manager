import { Module } from '@nestjs/common';
import { AggregateBusinessModule } from '../../business/aggregate-business/aggregate-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { AggregateController } from './aggregate.controller';

@Module({
  imports: [AggregateBusinessModule, HouseholdMemberModule],
  controllers: [AggregateController],
})
export class AggregateInterfaceModule {}
