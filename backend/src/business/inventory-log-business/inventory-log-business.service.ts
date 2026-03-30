import { Injectable } from '@nestjs/common';
import { InventoryLogContextService } from '../../context/inventory-log-context/inventory-log-context.service';
import { InventoryLogResult } from '../../context/inventory-log-context/interfaces/inventory-log-context.interface';

@Injectable()
export class InventoryLogBusinessService {
  constructor(
    private readonly inventoryLogContextService: InventoryLogContextService,
  ) {}

  async 재고_변경_이력을_조회한다(
    inventoryItemId: string,
    from?: Date,
    to?: Date,
  ): Promise<InventoryLogResult[]> {
    return this.inventoryLogContextService.재고_변경_이력을_조회한다(
      inventoryItemId,
      from,
      to,
    );
  }

  async 소비를_등록한다(
    inventoryItemId: string,
    quantityDelta: number,
    userId: string | null,
    memo: string | null,
  ): Promise<InventoryLogResult> {
    return this.inventoryLogContextService.소비를_등록한다(
      inventoryItemId,
      quantityDelta,
      userId,
      memo,
    );
  }

  async 폐기를_등록한다(
    inventoryItemId: string,
    quantityDelta: number,
    reason: string | null,
    userId: string | null,
    memo: string | null,
  ): Promise<InventoryLogResult> {
    return this.inventoryLogContextService.폐기를_등록한다(
      inventoryItemId,
      quantityDelta,
      reason,
      userId,
      memo,
    );
  }

  async 수량을_수동_조정한다(
    inventoryItemId: string,
    quantityDelta: number,
    userId: string | null,
    memo: string | null,
  ): Promise<InventoryLogResult> {
    return this.inventoryLogContextService.수량을_수동_조정한다(
      inventoryItemId,
      quantityDelta,
      userId,
      memo,
    );
  }
}
