import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InventoryLogResult } from './interfaces/inventory-log-context.interface';
import { GetInventoryLogListQuery } from './handlers/queries/get-inventory-log-list.handler';
import { CreateConsumptionCommand } from './handlers/commands/create-consumption.handler';
import { CreateWasteCommand } from './handlers/commands/create-waste.handler';
import { CreateAdjustmentCommand } from './handlers/commands/create-adjustment.handler';

@Injectable()
export class InventoryLogContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async 재고_변경_이력을_조회한다(
    inventoryItemId: string,
    from?: Date,
    to?: Date,
  ): Promise<InventoryLogResult[]> {
    return this.queryBus.execute(
      new GetInventoryLogListQuery(inventoryItemId, from, to),
    );
  }

  async 소비를_등록한다(
    inventoryItemId: string,
    quantityDelta: number,
    userId: string | null,
    memo: string | null,
  ): Promise<InventoryLogResult> {
    return this.commandBus.execute(
      new CreateConsumptionCommand(inventoryItemId, quantityDelta, userId, memo),
    );
  }

  async 폐기를_등록한다(
    inventoryItemId: string,
    quantityDelta: number,
    reason: string | null,
    userId: string | null,
    memo: string | null,
  ): Promise<InventoryLogResult> {
    return this.commandBus.execute(
      new CreateWasteCommand(
        inventoryItemId,
        quantityDelta,
        reason,
        userId,
        memo,
      ),
    );
  }

  async 수량을_수동_조정한다(
    inventoryItemId: string,
    quantityDelta: number,
    userId: string | null,
    memo: string | null,
  ): Promise<InventoryLogResult> {
    return this.commandBus.execute(
      new CreateAdjustmentCommand(inventoryItemId, quantityDelta, userId, memo),
    );
  }
}
