import { Module } from '@nestjs/common';
import { HouseholdKindContextModule } from '../../context/household-kind-context/household-kind-context.module';
import { HouseholdKindBusinessService } from './household-kind-business.service';

@Module({
  imports: [HouseholdKindContextModule],
  providers: [HouseholdKindBusinessService],
  exports: [HouseholdKindBusinessService],
})
export class HouseholdKindBusinessModule {}
