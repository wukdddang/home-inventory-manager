import { Module } from '@nestjs/common';
import { HouseholdContextModule } from '../../context/household-context/household-context.module';
import { HouseholdBusinessService } from './household-business.service';

@Module({
  imports: [HouseholdContextModule],
  providers: [HouseholdBusinessService],
  exports: [HouseholdBusinessService],
})
export class HouseholdBusinessModule {}
