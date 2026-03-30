import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ShoppingListItemService } from '../../../../domain/shopping-list-item/shopping-list-item.service';
import { UpdateShoppingListItemData } from '../../interfaces/shopping-list-context.interface';

export class UpdateShoppingListItemCommand {
  constructor(
    public readonly id: string,
    public readonly householdId: string,
    public readonly data: UpdateShoppingListItemData,
  ) {}
}

@CommandHandler(UpdateShoppingListItemCommand)
export class UpdateShoppingListItemHandler
  implements ICommandHandler<UpdateShoppingListItemCommand>
{
  constructor(
    private readonly shoppingListItemService: ShoppingListItemService,
  ) {}

  async execute(command: UpdateShoppingListItemCommand) {
    const item = await this.shoppingListItemService.장보기_항목을_수정한다(
      command.id,
      command.householdId,
      command.data,
    );
    if (!item) {
      throw new NotFoundException('장보기 항목을 찾을 수 없습니다.');
    }
    return item;
  }
}
