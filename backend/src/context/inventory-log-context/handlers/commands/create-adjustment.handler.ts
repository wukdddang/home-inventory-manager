import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InventoryItemService } from '../../../../domain/inventory-item/inventory-item.service';
import { InventoryLogService } from '../../../../domain/inventory-log/inventory-log.service';
import { InventoryLogResult } from '../../interfaces/inventory-log-context.interface';

export class CreateAdjustmentCommand {
  constructor(
    public readonly inventoryItemId: string,
    public readonly quantityDelta: number,
    public readonly userId: string | null,
    public readonly memo: string | null,
  ) {}
}

@CommandHandler(CreateAdjustmentCommand)
export class CreateAdjustmentHandler
  implements ICommandHandler<CreateAdjustmentCommand>
{
  constructor(
    private readonly inventoryItemService: InventoryItemService,
    private readonly inventoryLogService: InventoryLogService,
  ) {}

  async execute(command: CreateAdjustmentCommand): Promise<InventoryLogResult> {
    const item = await this.inventoryItemService.재고_품목을_단건_조회한다(
      command.inventoryItemId,
    );
    if (!item) {
      throw new NotFoundException('재고 품목을 찾을 수 없습니다.');
    }

    const updatedItem = await this.inventoryItemService.재고_수량을_증가한다(
      command.inventoryItemId,
      command.quantityDelta,
    );

    return this.inventoryLogService.재고_변경_이력을_생성한다({
      inventoryItemId: command.inventoryItemId,
      type: 'adjust',
      quantityDelta: command.quantityDelta,
      quantityAfter: Number(updatedItem!.quantity),
      userId: command.userId,
      memo: command.memo,
      itemLabel: item.productVariant?.product?.name ?? null,
    });
  }
}
