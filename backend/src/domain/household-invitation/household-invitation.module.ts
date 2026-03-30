import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseholdInvitation } from './household-invitation.entity';
import { HouseholdInvitationService } from './household-invitation.service';

@Module({
  imports: [TypeOrmModule.forFeature([HouseholdInvitation])],
  providers: [HouseholdInvitationService],
  exports: [HouseholdInvitationService],
})
export class HouseholdInvitationModule {}
