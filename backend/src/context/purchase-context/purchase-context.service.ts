import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreatePurchaseData,
  LinkPurchaseInventoryData,
  PurchaseResult,
} from './interfaces/purchase-context.interface';
import { CreatePurchaseCommand } from './handlers/commands/create-purchase.handler';
import { LinkPurchaseInventoryCommand } from './handlers/commands/link-purchase-inventory.handler';
import { GetPurchaseListQuery } from './handlers/queries/get-purchase-list.handler';

@Injectable()
export class PurchaseContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async 구매_목록을_조회한다(
    householdId: string,
  ): Promise<PurchaseResult[]> {
    return this.queryBus.execute(new GetPurchaseListQuery(householdId));
  }

  async 구매를_등록한다(data: CreatePurchaseData): Promise<PurchaseResult> {
    return this.commandBus.execute(
      new CreatePurchaseCommand(
        data.householdId,
        data.inventoryItemId ?? null,
        data.unitPrice,
        data.purchasedAt,
        data.supplierName ?? null,
        data.itemName ?? null,
        data.variantCaption ?? null,
        data.unitSymbol ?? null,
        data.memo ?? null,
        data.userId ?? null,
        data.batches,
      ),
    );
  }

  async 구매에_재고를_나중에_연결한다(
    id: string,
    householdId: string,
    data: LinkPurchaseInventoryData,
    userId: string | null,
  ): Promise<PurchaseResult> {
    return this.commandBus.execute(
      new LinkPurchaseInventoryCommand(
        id,
        householdId,
        data.inventoryItemId,
        userId,
      ),
    );
  }
}
