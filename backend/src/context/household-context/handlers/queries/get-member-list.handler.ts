import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { HouseholdMemberService } from '../../../../domain/household/household-member.service';
import { HouseholdMemberResult } from '../../interfaces/household-context.interface';

export class GetMemberListQuery {
  constructor(public readonly householdId: string) {}
}

@QueryHandler(GetMemberListQuery)
export class GetMemberListHandler implements IQueryHandler<GetMemberListQuery> {
  constructor(
    private readonly householdMemberService: HouseholdMemberService,
  ) {}

  async execute(query: GetMemberListQuery): Promise<HouseholdMemberResult[]> {
    const members =
      await this.householdMemberService.거점의_멤버_목록을_조회한다(
        query.householdId,
      );

    return members.map((member) => ({
      id: member.id,
      userId: member.userId,
      email: member.user?.email ?? '',
      displayName: member.user?.displayName ?? '',
      role: member.role,
      createdAt: member.createdAt,
    }));
  }
}
