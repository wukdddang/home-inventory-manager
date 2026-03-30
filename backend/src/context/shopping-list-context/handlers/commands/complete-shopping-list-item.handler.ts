import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ShoppingListItemService } from '../../../../domain/shopping-list-item/shopping-list-item.service';
import { InventoryItemService } from '../../../../domain/inventory-item/inventory-item.service';
import { InventoryLogService } from '../../../../domain/inventory-log/inventory-log.service';
import { CompleteShoppingListItemResult } from '../../interfaces/shopping-list-context.interface';

export class CompleteShoppingListItemCommand {
  constructor(
    public readonly id: string,
    public readonly householdId: string,
    public readonly inventoryItemId: string,
    public readonly quantity: number,
    public readonly memo: string | null,
    public readonly userId: string | null,
  ) {}
}

@CommandHandler(CompleteShoppingListItemCommand)
export class CompleteShoppingListItemHandler
  implements ICommandHandler<CompleteShoppingListItemCommand>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly shoppingListItemService: ShoppingListItemService,
    private readonly inventoryItemService: InventoryItemService,
    private readonly inventoryLogService: InventoryLogService,
  ) {}

  async execute(
    command: CompleteShoppingListItemCommand,
  ): Promise<CompleteShoppingListItemResult> {
    return this.dataSource.transaction(async () => {
      // 장보기 항목 확인
      const shoppingItem =
        await this.shoppingListItemService.장보기_항목을_단건_조회한다(
          command.id,
          command.householdId,
        );
      if (!shoppingItem) {
        throw new NotFoundException('장보기 항목을 찾을 수 없습니다.');
      }

      // 재고 품목 확인
      const inventoryItem =
        await this.inventoryItemService.재고_품목을_단건_조회한다(
          command.inventoryItemId,
        );
      if (!inventoryItem) {
        throw new NotFoundException('재고 품목을 찾을 수 없습니다.');
      }

      // 1. 재고 수량 증가
      const updatedItem =
        await this.inventoryItemService.재고_수량을_증가한다(
          command.inventoryItemId,
          command.quantity,
        );

      // 2. 재고 변경 이력 생성
      const itemLabel =
        shoppingItem.product?.name ??
        inventoryItem.productVariant?.product?.name ??
        null;

      const log = await this.inventoryLogService.재고_변경_이력을_생성한다({
        inventoryItemId: command.inventoryItemId,
        type: 'in',
        quantityDelta: command.quantity,
        quantityAfter: Number(updatedItem!.quantity),
        userId: command.userId,
        itemLabel,
        memo: command.memo ?? '장보기 구매 완료',
        refType: 'shopping',
        refId: command.id,
      });

      // 3. 장보기 항목 삭제
      await this.shoppingListItemService.장보기_항목을_삭제한다(
        command.id,
        command.householdId,
      );

      return {
        inventoryItem: {
          id: updatedItem!.id,
          quantity: Number(updatedItem!.quantity),
        },
        inventoryLog: {
          id: log.id,
          type: log.type,
          quantityDelta: Number(log.quantityDelta),
          quantityAfter: Number(log.quantityAfter),
        },
      };
    });
  }
}
