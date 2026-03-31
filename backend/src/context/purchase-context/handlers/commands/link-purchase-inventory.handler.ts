import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PurchaseService } from '../../../../domain/purchase/purchase.service';
import { PurchaseBatchService } from '../../../../domain/purchase-batch/purchase-batch.service';
import { InventoryItemService } from '../../../../domain/inventory-item/inventory-item.service';
import { InventoryLogService } from '../../../../domain/inventory-log/inventory-log.service';
import { PurchaseResult } from '../../interfaces/purchase-context.interface';

export class LinkPurchaseInventoryCommand {
  constructor(
    public readonly id: string,
    public readonly householdId: string,
    public readonly inventoryItemId: string,
    public readonly userId: string | null,
  ) {}
}

@CommandHandler(LinkPurchaseInventoryCommand)
export class LinkPurchaseInventoryHandler
  implements ICommandHandler<LinkPurchaseInventoryCommand>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly purchaseService: PurchaseService,
    private readonly purchaseBatchService: PurchaseBatchService,
    private readonly inventoryItemService: InventoryItemService,
    private readonly inventoryLogService: InventoryLogService,
  ) {}

  async execute(
    command: LinkPurchaseInventoryCommand,
  ): Promise<PurchaseResult> {
    return this.dataSource.transaction(async (manager) => {
      // 1. 구매 기록에 재고 연결
      const purchase = await this.purchaseService.구매에_재고를_연결한다(
        command.id,
        command.householdId,
        command.inventoryItemId,
      );
      if (!purchase) {
        throw new NotFoundException('구매 기록을 찾을 수 없습니다.');
      }

      // 2. 로트 수량 합산
      const batches = await this.purchaseBatchService.로트_목록을_조회한다(
        purchase.id,
      );
      const totalQuantity = batches.reduce(
        (sum, b) => sum + Number(b.quantity),
        0,
      );

      // 3. 재고 수량 증가 + 이력 생성
      if (totalQuantity > 0) {
        const updatedItem =
          await this.inventoryItemService.재고_수량을_증가한다(
            command.inventoryItemId,
            totalQuantity,
          );

        if (updatedItem) {
          await this.inventoryLogService.재고_변경_이력을_생성한다({
            inventoryItemId: command.inventoryItemId,
            type: 'in',
            quantityDelta: totalQuantity,
            quantityAfter: Number(updatedItem.quantity),
            userId: command.userId,
            itemLabel: purchase.itemName,
            memo: '구매 기록 재고 연결에 의한 입고',
            refType: 'purchase',
            refId: purchase.id,
          });
        }
      }

      return {
        ...purchase,
        batches: batches.map((b) => ({
          id: b.id,
          purchaseId: b.purchaseId,
          quantity: Number(b.quantity),
          expirationDate: b.expirationDate,
          createdAt: b.createdAt,
        })),
      };
    });
  }
}
