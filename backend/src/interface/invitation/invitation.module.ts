import { Module } from '@nestjs/common';
import { InvitationBusinessModule } from '../../business/invitation-business/invitation-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { InvitationController } from './invitation.controller';

@Module({
  imports: [InvitationBusinessModule, HouseholdMemberModule],
  controllers: [InvitationController],
})
export class InvitationInterfaceModule {}
