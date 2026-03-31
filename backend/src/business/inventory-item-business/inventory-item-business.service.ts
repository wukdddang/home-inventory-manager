import { Injectable } from '@nestjs/common';
import { InventoryItemContextService } from '../../context/inventory-item-context/inventory-item-context.service';
import {
  InventoryItemResult,
  CreateInventoryItemData,
} from '../../context/inventory-item-context/interfaces/inventory-item-context.interface';

@Injectable()
export class InventoryItemBusinessService {
  constructor(
    private readonly inventoryItemContextService: InventoryItemContextService,
  ) {}

  async 재고_품목_목록을_조회한다(
    householdId: string,
  ): Promise<InventoryItemResult[]> {
    return this.inventoryItemContextService.재고_품목_목록을_조회한다(
      householdId,
    );
  }

  async 재고_품목을_생성한다(
    data: CreateInventoryItemData,
  ): Promise<InventoryItemResult> {
    return this.inventoryItemContextService.재고_품목을_생성한다(data);
  }

  async 재고_수량을_수정한다(
    id: string,
    quantity: number,
  ): Promise<InventoryItemResult> {
    return this.inventoryItemContextService.재고_수량을_수정한다(id, quantity);
  }
}
