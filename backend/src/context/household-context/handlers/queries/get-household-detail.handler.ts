import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { HouseholdService } from '../../../../domain/household/household.service';
import { HouseholdResult } from '../../interfaces/household-context.interface';

export class GetHouseholdDetailQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetHouseholdDetailQuery)
export class GetHouseholdDetailHandler
  implements IQueryHandler<GetHouseholdDetailQuery>
{
  constructor(private readonly householdService: HouseholdService) {}

  async execute(query: GetHouseholdDetailQuery): Promise<HouseholdResult> {
    const household = await this.householdService.ID로_거점을_조회한다(
      query.id,
    );
    if (!household) {
      throw new NotFoundException('거점을 찾을 수 없습니다');
    }

    return {
      id: household.id,
      name: household.name,
      kind: household.kind,
      createdAt: household.createdAt,
      updatedAt: household.updatedAt,
    };
  }
}
