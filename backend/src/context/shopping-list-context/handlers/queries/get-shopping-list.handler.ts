import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ShoppingListItemService } from '../../../../domain/shopping-list-item/shopping-list-item.service';

export class GetShoppingListQuery {
  constructor(public readonly householdId: string) {}
}

@QueryHandler(GetShoppingListQuery)
export class GetShoppingListHandler
  implements IQueryHandler<GetShoppingListQuery>
{
  constructor(
    private readonly shoppingListItemService: ShoppingListItemService,
  ) {}

  async execute(query: GetShoppingListQuery) {
    return this.shoppingListItemService.장보기_항목_목록을_조회한다(
      query.householdId,
    );
  }
}
