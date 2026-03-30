import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { HouseStructureService } from '../../../../domain/house-structure/house-structure.service';
import { HouseStructureResult } from '../../interfaces/space-context.interface';

export class GetHouseStructureQuery {
  constructor(public readonly householdId: string) {}
}

@QueryHandler(GetHouseStructureQuery)
export class GetHouseStructureHandler
  implements IQueryHandler<GetHouseStructureQuery>
{
  constructor(
    private readonly houseStructureService: HouseStructureService,
  ) {}

  async execute(
    query: GetHouseStructureQuery,
  ): Promise<HouseStructureResult | null> {
    const structure =
      await this.houseStructureService.거점의_집_구조를_조회한다(
        query.householdId,
      );
    if (!structure) {
      return null;
    }

    return {
      id: structure.id,
      householdId: structure.householdId,
      name: structure.name,
      structurePayload: structure.structurePayload,
      diagramLayout: structure.diagramLayout,
      version: structure.version,
      createdAt: structure.createdAt,
      updatedAt: structure.updatedAt,
    };
  }
}
