import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PurchaseModule } from '../../domain/purchase/purchase.module';
import { PurchaseBatchModule } from '../../domain/purchase-batch/purchase-batch.module';
import { InventoryItemModule } from '../../domain/inventory-item/inventory-item.module';
import { InventoryLogModule } from '../../domain/inventory-log/inventory-log.module';
import { PurchaseContextService } from './purchase-context.service';
import { CreatePurchaseHandler } from './handlers/commands/create-purchase.handler';
import { LinkPurchaseInventoryHandler } from './handlers/commands/link-purchase-inventory.handler';
import { GetPurchaseListHandler } from './handlers/queries/get-purchase-list.handler';

const CommandHandlers = [CreatePurchaseHandler, LinkPurchaseInventoryHandler];

const QueryHandlers = [GetPurchaseListHandler];

@Module({
  imports: [
    CqrsModule,
    PurchaseModule,
    PurchaseBatchModule,
    InventoryItemModule,
    InventoryLogModule,
  ],
  providers: [PurchaseContextService, ...CommandHandlers, ...QueryHandlers],
  exports: [PurchaseContextService],
})
export class PurchaseContextModule {}
