import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InventoryItemModule } from '../../domain/inventory-item/inventory-item.module';
import { InventoryItemContextService } from './inventory-item-context.service';
import { CreateInventoryItemHandler } from './handlers/commands/create-inventory-item.handler';
import { UpdateInventoryItemQuantityHandler } from './handlers/commands/update-inventory-item-quantity.handler';
import { GetInventoryItemListHandler } from './handlers/queries/get-inventory-item-list.handler';

const CommandHandlers = [
  CreateInventoryItemHandler,
  UpdateInventoryItemQuantityHandler,
];

const QueryHandlers = [GetInventoryItemListHandler];

@Module({
  imports: [CqrsModule, InventoryItemModule],
  providers: [
    InventoryItemContextService,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [InventoryItemContextService],
})
export class InventoryItemContextModule {}
