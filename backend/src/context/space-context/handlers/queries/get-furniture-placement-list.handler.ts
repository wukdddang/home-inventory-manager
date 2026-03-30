import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FurniturePlacementService } from '../../../../domain/furniture-placement/furniture-placement.service';
import { FurniturePlacementResult } from '../../interfaces/space-context.interface';

export class GetFurniturePlacementListQuery {
  constructor(public readonly roomId: string) {}
}

@QueryHandler(GetFurniturePlacementListQuery)
export class GetFurniturePlacementListHandler
  implements IQueryHandler<GetFurniturePlacementListQuery>
{
  constructor(
    private readonly furniturePlacementService: FurniturePlacementService,
  ) {}

  async execute(
    query: GetFurniturePlacementListQuery,
  ): Promise<FurniturePlacementResult[]> {
    const placements =
      await this.furniturePlacementService.방의_가구_목록을_조회한다(
        query.roomId,
      );

    return placements.map((placement) => ({
      id: placement.id,
      roomId: placement.roomId,
      label: placement.label,
      productId: placement.productId,
      productVariantId: placement.productVariantId,
      anchorDirectStorageId: placement.anchorDirectStorageId,
      sortOrder: placement.sortOrder,
      placementPayload: placement.placementPayload,
      createdAt: placement.createdAt,
      updatedAt: placement.updatedAt,
    }));
  }
}
