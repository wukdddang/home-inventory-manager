import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InventoryItemService } from '../../../../domain/inventory-item/inventory-item.service';

export class GetInventoryItemListQuery {
  constructor(public readonly householdId: string) {}
}

@QueryHandler(GetInventoryItemListQuery)
export class GetInventoryItemListHandler
  implements IQueryHandler<GetInventoryItemListQuery>
{
  constructor(
    private readonly inventoryItemService: InventoryItemService,
  ) {}

  async execute(query: GetInventoryItemListQuery) {
    return this.inventoryItemService.재고_품목_목록을_조회한다(
      query.householdId,
    );
  }
}
