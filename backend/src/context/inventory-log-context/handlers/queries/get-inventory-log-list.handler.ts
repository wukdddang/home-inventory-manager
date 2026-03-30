import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InventoryLogService } from '../../../../domain/inventory-log/inventory-log.service';

export class GetInventoryLogListQuery {
  constructor(
    public readonly inventoryItemId: string,
    public readonly from?: Date,
    public readonly to?: Date,
  ) {}
}

@QueryHandler(GetInventoryLogListQuery)
export class GetInventoryLogListHandler
  implements IQueryHandler<GetInventoryLogListQuery>
{
  constructor(
    private readonly inventoryLogService: InventoryLogService,
  ) {}

  async execute(query: GetInventoryLogListQuery) {
    return this.inventoryLogService.재고_변경_이력을_조회한다(
      query.inventoryItemId,
      { from: query.from, to: query.to },
    );
  }
}
