import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ShoppingListItemService } from '../../../../domain/shopping-list-item/shopping-list-item.service';

export class DeleteShoppingListItemCommand {
  constructor(
    public readonly id: string,
    public readonly householdId: string,
  ) {}
}

@CommandHandler(DeleteShoppingListItemCommand)
export class DeleteShoppingListItemHandler
  implements ICommandHandler<DeleteShoppingListItemCommand>
{
  constructor(
    private readonly shoppingListItemService: ShoppingListItemService,
  ) {}

  async execute(command: DeleteShoppingListItemCommand): Promise<void> {
    const deleted = await this.shoppingListItemService.장보기_항목을_삭제한다(
      command.id,
      command.householdId,
    );
    if (!deleted) {
      throw new NotFoundException('장보기 항목을 찾을 수 없습니다.');
    }
  }
}
