import { Module } from '@nestjs/common';
import { ApplianceBusinessModule } from '../../business/appliance-business/appliance-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { ApplianceController } from './appliance.controller';

@Module({
    imports: [ApplianceBusinessModule, HouseholdMemberModule],
    controllers: [ApplianceController],
})
export class ApplianceInterfaceModule {}
