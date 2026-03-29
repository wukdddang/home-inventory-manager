import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreateHouseholdData,
  UpdateHouseholdData,
  AddMemberData,
  ChangeMemberRoleData,
  HouseholdResult,
  HouseholdMemberResult,
} from './interfaces/household-context.interface';
import { CreateHouseholdCommand } from './handlers/commands/create-household.handler';
import { UpdateHouseholdCommand } from './handlers/commands/update-household.handler';
import { DeleteHouseholdCommand } from './handlers/commands/delete-household.handler';
import { AddMemberCommand } from './handlers/commands/add-member.handler';
import { ChangeMemberRoleCommand } from './handlers/commands/change-member-role.handler';
import { RemoveMemberCommand } from './handlers/commands/remove-member.handler';
import { GetHouseholdListQuery } from './handlers/queries/get-household-list.handler';
import { GetHouseholdDetailQuery } from './handlers/queries/get-household-detail.handler';
import { GetMemberListQuery } from './handlers/queries/get-member-list.handler';

@Injectable()
export class HouseholdContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async 거점을_생성한다(data: CreateHouseholdData): Promise<HouseholdResult> {
    return this.commandBus.execute(
      new CreateHouseholdCommand(data.userId, data.name, data.kind),
    );
  }

  async 거점을_수정한다(
    id: string,
    data: UpdateHouseholdData,
  ): Promise<HouseholdResult> {
    return this.commandBus.execute(new UpdateHouseholdCommand(id, data));
  }

  async 거점을_삭제한다(id: string): Promise<void> {
    return this.commandBus.execute(new DeleteHouseholdCommand(id));
  }

  async 거점_목록을_조회한다(userId: string): Promise<HouseholdResult[]> {
    return this.queryBus.execute(new GetHouseholdListQuery(userId));
  }

  async 거점_상세를_조회한다(id: string): Promise<HouseholdResult> {
    return this.queryBus.execute(new GetHouseholdDetailQuery(id));
  }

  async 멤버_목록을_조회한다(
    householdId: string,
  ): Promise<HouseholdMemberResult[]> {
    return this.queryBus.execute(new GetMemberListQuery(householdId));
  }

  async 멤버를_추가한다(
    data: AddMemberData,
  ): Promise<HouseholdMemberResult> {
    return this.commandBus.execute(
      new AddMemberCommand(data.householdId, data.userId, data.role),
    );
  }

  async 멤버_역할을_변경한다(
    memberId: string,
    requestingUserId: string,
    data: ChangeMemberRoleData,
  ): Promise<void> {
    return this.commandBus.execute(
      new ChangeMemberRoleCommand(memberId, requestingUserId, data.role),
    );
  }

  async 멤버를_제거한다(
    memberId: string,
    requestingUserId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new RemoveMemberCommand(memberId, requestingUserId),
    );
  }
}
