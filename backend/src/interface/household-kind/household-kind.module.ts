import { Module } from '@nestjs/common';
import { HouseholdKindBusinessModule } from '../../business/household-kind-business/household-kind-business.module';
import { HouseholdKindController } from './household-kind.controller';

@Module({
  imports: [HouseholdKindBusinessModule],
  controllers: [HouseholdKindController],
})
export class HouseholdKindInterfaceModule {}
