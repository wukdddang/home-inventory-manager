import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { HouseholdMemberService } from '../../../../domain/household/household-member.service';
import { HouseholdResult } from '../../interfaces/household-context.interface';

export class GetHouseholdListQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetHouseholdListQuery)
export class GetHouseholdListHandler
  implements IQueryHandler<GetHouseholdListQuery>
{
  constructor(
    private readonly householdMemberService: HouseholdMemberService,
  ) {}

  async execute(query: GetHouseholdListQuery): Promise<HouseholdResult[]> {
    const members =
      await this.householdMemberService.사용자의_거점_목록을_조회한다(
        query.userId,
      );

    return members.map((member) => ({
      id: member.household.id,
      name: member.household.name,
      kind: member.household.kind,
      createdAt: member.household.createdAt,
      updatedAt: member.household.updatedAt,
    }));
  }
}
