import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HouseholdInvitationModule } from '../../domain/household-invitation/household-invitation.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { InvitationContextService } from './invitation-context.service';
import { CreateInvitationHandler } from './handlers/commands/create-invitation.handler';
import { RevokeInvitationHandler } from './handlers/commands/revoke-invitation.handler';
import { AcceptInvitationHandler } from './handlers/commands/accept-invitation.handler';
import { GetInvitationListHandler } from './handlers/queries/get-invitation-list.handler';
import { GetInvitationByTokenHandler } from './handlers/queries/get-invitation-by-token.handler';

const CommandHandlers = [
  CreateInvitationHandler,
  RevokeInvitationHandler,
  AcceptInvitationHandler,
];

const QueryHandlers = [GetInvitationListHandler, GetInvitationByTokenHandler];

@Module({
  imports: [CqrsModule, HouseholdInvitationModule, HouseholdMemberModule],
  providers: [InvitationContextService, ...CommandHandlers, ...QueryHandlers],
  exports: [InvitationContextService],
})
export class InvitationContextModule {}
