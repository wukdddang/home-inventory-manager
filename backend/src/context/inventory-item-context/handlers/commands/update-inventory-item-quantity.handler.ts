import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InventoryItemService } from '../../../../domain/inventory-item/inventory-item.service';

export class UpdateInventoryItemQuantityCommand {
  constructor(
    public readonly id: string,
    public readonly quantity: number,
  ) {}
}

@CommandHandler(UpdateInventoryItemQuantityCommand)
export class UpdateInventoryItemQuantityHandler
  implements ICommandHandler<UpdateInventoryItemQuantityCommand>
{
  constructor(
    private readonly inventoryItemService: InventoryItemService,
  ) {}

  async execute(command: UpdateInventoryItemQuantityCommand) {
    const item = await this.inventoryItemService.재고_수량을_수정한다(
      command.id,
      command.quantity,
    );
    if (!item) {
      throw new NotFoundException('재고 품목을 찾을 수 없습니다.');
    }
    return item;
  }
}
