import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingListItem } from './shopping-list-item.entity';

@Injectable()
export class ShoppingListItemService {
  constructor(
    @InjectRepository(ShoppingListItem)
    private readonly repo: Repository<ShoppingListItem>,
  ) {}

  async 장보기_항목_목록을_조회한다(
    householdId: string,
  ): Promise<ShoppingListItem[]> {
    return this.repo.find({
      where: { householdId },
      relations: ['category', 'product', 'productVariant'],
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async 장보기_항목을_단건_조회한다(
    id: string,
    householdId: string,
  ): Promise<ShoppingListItem | null> {
    return this.repo.findOne({
      where: { id, householdId },
      relations: ['category', 'product', 'productVariant'],
    });
  }

  async 장보기_항목을_추가한다(data: {
    householdId: string;
    categoryId?: string | null;
    productId?: string | null;
    productVariantId?: string | null;
    sourceInventoryItemId?: string | null;
    targetStorageLocationId?: string | null;
    quantity?: number | null;
    sortOrder?: number;
    memo?: string | null;
  }): Promise<ShoppingListItem> {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async 장보기_항목을_수정한다(
    id: string,
    householdId: string,
    data: {
      categoryId?: string | null;
      productId?: string | null;
      productVariantId?: string | null;
      sourceInventoryItemId?: string | null;
      targetStorageLocationId?: string | null;
      quantity?: number | null;
      sortOrder?: number;
      memo?: string | null;
    },
  ): Promise<ShoppingListItem | null> {
    const item = await this.repo.findOne({ where: { id, householdId } });
    if (!item) return null;

    Object.assign(item, data);
    return this.repo.save(item);
  }

  async 장보기_항목을_삭제한다(
    id: string,
    householdId: string,
  ): Promise<boolean> {
    const result = await this.repo.delete({ id, householdId });
    return (result.affected ?? 0) > 0;
  }
}
