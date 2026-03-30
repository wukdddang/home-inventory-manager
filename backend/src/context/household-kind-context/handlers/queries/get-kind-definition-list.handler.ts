import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { HouseholdKindDefinitionService } from '../../../../domain/household-kind-definition/household-kind-definition.service';
import { KindDefinitionResult } from '../../interfaces/household-kind-context.interface';

export class GetKindDefinitionListQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetKindDefinitionListQuery)
export class GetKindDefinitionListHandler
  implements IQueryHandler<GetKindDefinitionListQuery>
{
  constructor(
    private readonly kindDefinitionService: HouseholdKindDefinitionService,
  ) {}

  async execute(
    query: GetKindDefinitionListQuery,
  ): Promise<KindDefinitionResult[]> {
    const definitions =
      await this.kindDefinitionService.사용자의_유형_목록을_조회한다(
        query.userId,
      );

    return definitions.map((def) => ({
      id: def.id,
      kindId: def.kindId,
      label: def.label,
      sortOrder: def.sortOrder,
      createdAt: def.createdAt,
      updatedAt: def.updatedAt,
    }));
  }
}
