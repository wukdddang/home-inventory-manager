import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ShoppingListItemService } from '../../../../domain/shopping-list-item/shopping-list-item.service';
import { CreateShoppingListItemData } from '../../interfaces/shopping-list-context.interface';

export class CreateShoppingListItemCommand {
  constructor(public readonly data: CreateShoppingListItemData) {}
}

@CommandHandler(CreateShoppingListItemCommand)
export class CreateShoppingListItemHandler
  implements ICommandHandler<CreateShoppingListItemCommand>
{
  constructor(
    private readonly shoppingListItemService: ShoppingListItemService,
  ) {}

  async execute(command: CreateShoppingListItemCommand) {
    return this.shoppingListItemService.장보기_항목을_추가한다(command.data);
  }
}
