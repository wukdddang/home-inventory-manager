import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InventoryLogModule } from '../../domain/inventory-log/inventory-log.module';
import { InventoryItemModule } from '../../domain/inventory-item/inventory-item.module';
import { InventoryLogContextService } from './inventory-log-context.service';
import { GetInventoryLogListHandler } from './handlers/queries/get-inventory-log-list.handler';
import { CreateConsumptionHandler } from './handlers/commands/create-consumption.handler';
import { CreateWasteHandler } from './handlers/commands/create-waste.handler';
import { CreateAdjustmentHandler } from './handlers/commands/create-adjustment.handler';

const CommandHandlers = [
  CreateConsumptionHandler,
  CreateWasteHandler,
  CreateAdjustmentHandler,
];

const QueryHandlers = [GetInventoryLogListHandler];

@Module({
  imports: [CqrsModule, InventoryLogModule, InventoryItemModule],
  providers: [
    InventoryLogContextService,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [InventoryLogContextService],
})
export class InventoryLogContextModule {}
