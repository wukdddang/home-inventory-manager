import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InventoryItemService } from '../../domain/inventory-item/inventory-item.service';
import { PurchaseBatchService } from '../../domain/purchase-batch/purchase-batch.service';
import { ShoppingListItemService } from '../../domain/shopping-list-item/shopping-list-item.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Household } from '../../domain/household/household.entity';

@Injectable()
export class ShoppingSuggestionScheduler {
  private readonly logger = new Logger(ShoppingSuggestionScheduler.name);

  constructor(
    @InjectRepository(Household)
    private readonly householdRepository: Repository<Household>,
    private readonly inventoryItemService: InventoryItemService,
    private readonly purchaseBatchService: PurchaseBatchService,
    private readonly shoppingListItemService: ShoppingListItemService,
  ) {}

  /**
   * 매일 오전 8시에 부족 품목 + 유통기한 임박 품목을 장보기에 자동 제안
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async 장보기_자동_제안을_실행한다() {
    this.logger.log('장보기 자동 제안 스케줄러 시작');

    const households = await this.householdRepository.find();

    for (const household of households) {
      await this.부족_품목을_제안한다(household.id);
      await this.유통기한_임박_품목을_제안한다(household.id);
    }

    this.logger.log('장보기 자동 제안 스케줄러 완료');
  }

  async 부족_품목을_제안한다(householdId: string): Promise<number> {
    const lowStockItems =
      await this.inventoryItemService.부족_품목_목록을_조회한다(householdId);

    const existingItems =
      await this.shoppingListItemService.장보기_항목_목록을_조회한다(householdId);
    const existingInventoryIds = new Set(
      existingItems
        .filter((i) => i.sourceInventoryItemId)
        .map((i) => i.sourceInventoryItemId),
    );

    let created = 0;
    for (const item of lowStockItems) {
      if (existingInventoryIds.has(item.id)) continue;

      const shortage = Number(item.minStockLevel) - Number(item.quantity);
      if (shortage <= 0) continue;

      await this.shoppingListItemService.장보기_항목을_추가한다({
        householdId,
        productId: item.productVariant?.product?.id ?? null,
        productVariantId: item.productVariantId,
        sourceInventoryItemId: item.id,
        targetStorageLocationId: item.storageLocationId,
        quantity: shortage,
        memo: `[자동 제안] 재고 부족 — ${item.productVariant?.product?.name ?? '품목'}`,
      });
      created++;
    }

    if (created > 0) {
      this.logger.log(`거점 ${householdId}: 부족 품목 ${created}건 장보기 제안`);
    }
    return created;
  }

  async 유통기한_임박_품목을_제안한다(householdId: string): Promise<number> {
    const expiringBatches =
      await this.purchaseBatchService.유통기한_임박_목록을_조회한다(
        householdId,
        7,
      );

    if (expiringBatches.length === 0) return 0;

    const existingItems =
      await this.shoppingListItemService.장보기_항목_목록을_조회한다(householdId);
    const existingMemos = new Set(existingItems.map((i) => i.memo));

    let created = 0;
    for (const batch of expiringBatches) {
      const itemName = batch.purchase?.itemName ?? '품목';
      const memo = `[자동 제안] 유통기한 임박 (${batch.expirationDate}) — ${itemName}`;

      if (existingMemos.has(memo)) continue;

      await this.shoppingListItemService.장보기_항목을_추가한다({
        householdId,
        quantity: Number(batch.quantity),
        memo,
      });
      created++;
    }

    if (created > 0) {
      this.logger.log(`거점 ${householdId}: 유통기한 임박 ${created}건 장보기 제안`);
    }
    return created;
  }
}
