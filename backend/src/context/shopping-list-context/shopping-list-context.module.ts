import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ShoppingListItemModule } from '../../domain/shopping-list-item/shopping-list-item.module';
import { InventoryItemModule } from '../../domain/inventory-item/inventory-item.module';
import { InventoryLogModule } from '../../domain/inventory-log/inventory-log.module';
import { ShoppingListContextService } from './shopping-list-context.service';
import { CreateShoppingListItemHandler } from './handlers/commands/create-shopping-list-item.handler';
import { UpdateShoppingListItemHandler } from './handlers/commands/update-shopping-list-item.handler';
import { DeleteShoppingListItemHandler } from './handlers/commands/delete-shopping-list-item.handler';
import { CompleteShoppingListItemHandler } from './handlers/commands/complete-shopping-list-item.handler';
import { GetShoppingListHandler } from './handlers/queries/get-shopping-list.handler';

const CommandHandlers = [
  CreateShoppingListItemHandler,
  UpdateShoppingListItemHandler,
  DeleteShoppingListItemHandler,
  CompleteShoppingListItemHandler,
];

const QueryHandlers = [GetShoppingListHandler];

@Module({
  imports: [
    CqrsModule,
    ShoppingListItemModule,
    InventoryItemModule,
    InventoryLogModule,
  ],
  providers: [
    ShoppingListContextService,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [ShoppingListContextService],
})
export class ShoppingListContextModule {}
