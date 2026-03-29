import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HouseholdModule } from '../../domain/household/household.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { HouseholdContextService } from './household-context.service';
import { CreateHouseholdHandler } from './handlers/commands/create-household.handler';
import { UpdateHouseholdHandler } from './handlers/commands/update-household.handler';
import { DeleteHouseholdHandler } from './handlers/commands/delete-household.handler';
import { AddMemberHandler } from './handlers/commands/add-member.handler';
import { ChangeMemberRoleHandler } from './handlers/commands/change-member-role.handler';
import { RemoveMemberHandler } from './handlers/commands/remove-member.handler';
import { GetHouseholdListHandler } from './handlers/queries/get-household-list.handler';
import { GetHouseholdDetailHandler } from './handlers/queries/get-household-detail.handler';
import { GetMemberListHandler } from './handlers/queries/get-member-list.handler';

const CommandHandlers = [
  CreateHouseholdHandler,
  UpdateHouseholdHandler,
  DeleteHouseholdHandler,
  AddMemberHandler,
  ChangeMemberRoleHandler,
  RemoveMemberHandler,
];

const QueryHandlers = [
  GetHouseholdListHandler,
  GetHouseholdDetailHandler,
  GetMemberListHandler,
];

@Module({
  imports: [CqrsModule, HouseholdModule, HouseholdMemberModule],
  providers: [HouseholdContextService, ...CommandHandlers, ...QueryHandlers],
  exports: [HouseholdContextService],
})
export class HouseholdContextModule {}
