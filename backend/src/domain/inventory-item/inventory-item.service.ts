import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from './inventory-item.entity';

@Injectable()
export class InventoryItemService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryItemRepository: Repository<InventoryItem>,
  ) {}

  async 재고_품목_목록을_조회한다(
    householdId: string,
  ): Promise<InventoryItem[]> {
    return this.inventoryItemRepository.find({
      where: { storageLocation: { householdId } },
      relations: ['productVariant', 'productVariant.product', 'productVariant.unit', 'storageLocation'],
      order: { createdAt: 'ASC' },
    });
  }

  async 재고_품목을_단건_조회한다(
    id: string,
  ): Promise<InventoryItem | null> {
    return this.inventoryItemRepository.findOne({
      where: { id },
      relations: ['productVariant', 'productVariant.product', 'productVariant.unit', 'storageLocation'],
    });
  }

  async 재고_품목을_생성한다(data: {
    productVariantId: string;
    storageLocationId: string;
    quantity?: number;
    minStockLevel?: number | null;
  }): Promise<InventoryItem> {
    const item = this.inventoryItemRepository.create({
      ...data,
      quantity: data.quantity ?? 0,
    });
    return this.inventoryItemRepository.save(item);
  }

  async 재고_수량을_수정한다(
    id: string,
    quantity: number,
  ): Promise<InventoryItem | null> {
    const item = await this.inventoryItemRepository.findOne({
      where: { id },
    });
    if (!item) return null;

    item.quantity = quantity;
    return this.inventoryItemRepository.save(item);
  }

  async 부족_품목_목록을_조회한다(
    householdId: string,
  ): Promise<InventoryItem[]> {
    return this.inventoryItemRepository
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.storageLocation', 'sl', 'sl.householdId = :householdId', { householdId })
      .innerJoinAndSelect('item.productVariant', 'pv')
      .innerJoinAndSelect('pv.product', 'p')
      .where('item.minStockLevel IS NOT NULL')
      .andWhere('item.quantity <= item.minStockLevel')
      .orderBy('item.createdAt', 'ASC')
      .getMany();
  }

  async 재고_수량을_증가한다(
    id: string,
    delta: number,
  ): Promise<InventoryItem | null> {
    const item = await this.inventoryItemRepository.findOne({
      where: { id },
    });
    if (!item) return null;

    item.quantity = Number(item.quantity) + delta;
    return this.inventoryItemRepository.save(item);
  }
}
