import { Module } from '@nestjs/common';
import { SpaceBusinessModule } from '../../business/space-business/space-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { SpaceController } from './space.controller';

@Module({
  imports: [SpaceBusinessModule, HouseholdMemberModule],
  controllers: [SpaceController],
})
export class SpaceInterfaceModule {}
