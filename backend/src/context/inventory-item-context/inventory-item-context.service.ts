import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  InventoryItemResult,
  CreateInventoryItemData,
} from './interfaces/inventory-item-context.interface';
import { CreateInventoryItemCommand } from './handlers/commands/create-inventory-item.handler';
import { UpdateInventoryItemQuantityCommand } from './handlers/commands/update-inventory-item-quantity.handler';
import { GetInventoryItemListQuery } from './handlers/queries/get-inventory-item-list.handler';

@Injectable()
export class InventoryItemContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async 재고_품목_목록을_조회한다(
    householdId: string,
  ): Promise<InventoryItemResult[]> {
    return this.queryBus.execute(
      new GetInventoryItemListQuery(householdId),
    );
  }

  async 재고_품목을_생성한다(
    data: CreateInventoryItemData,
  ): Promise<InventoryItemResult> {
    return this.commandBus.execute(
      new CreateInventoryItemCommand(
        data.productVariantId,
        data.storageLocationId,
        data.quantity,
        data.minStockLevel,
      ),
    );
  }

  async 재고_수량을_수정한다(
    id: string,
    quantity: number,
  ): Promise<InventoryItemResult> {
    return this.commandBus.execute(
      new UpdateInventoryItemQuantityCommand(id, quantity),
    );
  }
}
