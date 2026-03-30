import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreateShoppingListItemData,
  UpdateShoppingListItemData,
  ShoppingListItemResult,
  CompleteShoppingListItemResult,
} from './interfaces/shopping-list-context.interface';
import { CreateShoppingListItemCommand } from './handlers/commands/create-shopping-list-item.handler';
import { UpdateShoppingListItemCommand } from './handlers/commands/update-shopping-list-item.handler';
import { DeleteShoppingListItemCommand } from './handlers/commands/delete-shopping-list-item.handler';
import { CompleteShoppingListItemCommand } from './handlers/commands/complete-shopping-list-item.handler';
import { GetShoppingListQuery } from './handlers/queries/get-shopping-list.handler';

@Injectable()
export class ShoppingListContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async 장보기_항목_목록을_조회한다(
    householdId: string,
  ): Promise<ShoppingListItemResult[]> {
    return this.queryBus.execute(new GetShoppingListQuery(householdId));
  }

  async 장보기_항목을_추가한다(
    data: CreateShoppingListItemData,
  ): Promise<ShoppingListItemResult> {
    return this.commandBus.execute(new CreateShoppingListItemCommand(data));
  }

  async 장보기_항목을_수정한다(
    id: string,
    householdId: string,
    data: UpdateShoppingListItemData,
  ): Promise<ShoppingListItemResult> {
    return this.commandBus.execute(
      new UpdateShoppingListItemCommand(id, householdId, data),
    );
  }

  async 장보기_항목을_삭제한다(
    id: string,
    householdId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new DeleteShoppingListItemCommand(id, householdId),
    );
  }

  async 장보기_항목을_구매_완료_처리한다(
    id: string,
    householdId: string,
    inventoryItemId: string,
    quantity: number,
    memo: string | null,
    userId: string | null,
  ): Promise<CompleteShoppingListItemResult> {
    return this.commandBus.execute(
      new CompleteShoppingListItemCommand(
        id,
        householdId,
        inventoryItemId,
        quantity,
        memo,
        userId,
      ),
    );
  }
}
