import { Module } from '@nestjs/common';
import { UnitBusinessModule } from '../../business/unit-business/unit-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { UnitController } from './unit.controller';

@Module({
    imports: [UnitBusinessModule, HouseholdMemberModule],
    controllers: [UnitController],
})
export class UnitInterfaceModule {}
