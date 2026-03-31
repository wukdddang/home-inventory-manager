import { Injectable } from '@nestjs/common';
import { ShoppingListContextService } from '../../context/shopping-list-context/shopping-list-context.service';
import {
  CreateShoppingListItemData,
  UpdateShoppingListItemData,
  ShoppingListItemResult,
  CompleteShoppingListItemResult,
} from '../../context/shopping-list-context/interfaces/shopping-list-context.interface';

@Injectable()
export class ShoppingListBusinessService {
  constructor(
    private readonly shoppingListContextService: ShoppingListContextService,
  ) {}

  async 장보기_항목_목록을_조회한다(
    householdId: string,
  ): Promise<ShoppingListItemResult[]> {
    return this.shoppingListContextService.장보기_항목_목록을_조회한다(
      householdId,
    );
  }

  async 장보기_항목을_추가한다(
    data: CreateShoppingListItemData,
  ): Promise<ShoppingListItemResult> {
    return this.shoppingListContextService.장보기_항목을_추가한다(data);
  }

  async 장보기_항목을_수정한다(
    id: string,
    householdId: string,
    data: UpdateShoppingListItemData,
  ): Promise<ShoppingListItemResult> {
    return this.shoppingListContextService.장보기_항목을_수정한다(
      id,
      householdId,
      data,
    );
  }

  async 장보기_항목을_삭제한다(
    id: string,
    householdId: string,
  ): Promise<void> {
    return this.shoppingListContextService.장보기_항목을_삭제한다(
      id,
      householdId,
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
    return this.shoppingListContextService.장보기_항목을_구매_완료_처리한다(
      id,
      householdId,
      inventoryItemId,
      quantity,
      memo,
      userId,
    );
  }
}
