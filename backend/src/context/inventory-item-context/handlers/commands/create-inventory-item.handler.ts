import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InventoryItemService } from '../../../../domain/inventory-item/inventory-item.service';

export class CreateInventoryItemCommand {
  constructor(
    public readonly productVariantId: string,
    public readonly storageLocationId: string,
    public readonly quantity?: number,
    public readonly minStockLevel?: number | null,
  ) {}
}

@CommandHandler(CreateInventoryItemCommand)
export class CreateInventoryItemHandler
  implements ICommandHandler<CreateInventoryItemCommand>
{
  constructor(
    private readonly inventoryItemService: InventoryItemService,
  ) {}

  async execute(command: CreateInventoryItemCommand) {
    return this.inventoryItemService.재고_품목을_생성한다({
      productVariantId: command.productVariantId,
      storageLocationId: command.storageLocationId,
      quantity: command.quantity,
      minStockLevel: command.minStockLevel,
    });
  }
}
