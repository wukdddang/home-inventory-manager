import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { PurchaseService } from '../../../../domain/purchase/purchase.service';
import { PurchaseBatchService } from '../../../../domain/purchase-batch/purchase-batch.service';
import { InventoryItemService } from '../../../../domain/inventory-item/inventory-item.service';
import { InventoryLogService } from '../../../../domain/inventory-log/inventory-log.service';
import {
  CreatePurchaseBatchData,
  PurchaseResult,
} from '../../interfaces/purchase-context.interface';

export class CreatePurchaseCommand {
  constructor(
    public readonly householdId: string,
    public readonly inventoryItemId: string | null,
    public readonly unitPrice: number,
    public readonly purchasedAt: Date,
    public readonly supplierName: string | null,
    public readonly itemName: string | null,
    public readonly variantCaption: string | null,
    public readonly unitSymbol: string | null,
    public readonly memo: string | null,
    public readonly userId: string | null,
    public readonly batches: CreatePurchaseBatchData[],
  ) {}
}

@CommandHandler(CreatePurchaseCommand)
export class CreatePurchaseHandler
  implements ICommandHandler<CreatePurchaseCommand>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly purchaseService: PurchaseService,
    private readonly purchaseBatchService: PurchaseBatchService,
    private readonly inventoryItemService: InventoryItemService,
    private readonly inventoryLogService: InventoryLogService,
  ) {}

  async execute(command: CreatePurchaseCommand): Promise<PurchaseResult> {
    return this.dataSource.transaction(async (manager) => {
      // 1. 구매 기록 생성
      const purchase = await this.purchaseService.구매를_생성한다({
        householdId: command.householdId,
        inventoryItemId: command.inventoryItemId,
        unitPrice: command.unitPrice,
        purchasedAt: command.purchasedAt,
        supplierName: command.supplierName,
        itemName: command.itemName,
        variantCaption: command.variantCaption,
        unitSymbol: command.unitSymbol,
        memo: command.memo,
        userId: command.userId,
      });

      // 2. 유통기한 로트 생성
      const batches = await this.purchaseBatchService.로트를_일괄_생성한다(
        command.batches.map((b) => ({
          purchaseId: purchase.id,
          quantity: b.quantity,
          expirationDate: b.expirationDate,
        })),
      );

      // 3. 재고 연결된 경우 수량 자동 증가 + 이력 생성
      const totalQuantity = command.batches.reduce(
        (sum, b) => sum + b.quantity,
        0,
      );

      if (command.inventoryItemId && totalQuantity > 0) {
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
            itemLabel: command.itemName,
            memo: '구매 등록에 의한 입고',
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
