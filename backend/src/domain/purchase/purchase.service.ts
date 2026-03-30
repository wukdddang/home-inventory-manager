import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from './purchase.entity';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,
  ) {}

  async 구매_목록을_조회한다(householdId: string): Promise<Purchase[]> {
    return this.purchaseRepository.find({
      where: { householdId },
      relations: ['inventoryItem'],
      order: { purchasedAt: 'DESC' },
    });
  }

  async 구매를_단건_조회한다(
    id: string,
    householdId: string,
  ): Promise<Purchase | null> {
    return this.purchaseRepository.findOne({
      where: { id, householdId },
      relations: ['inventoryItem'],
    });
  }

  async 구매를_생성한다(data: {
    householdId: string;
    inventoryItemId?: string | null;
    unitPrice: number;
    purchasedAt: Date;
    supplierName?: string | null;
    itemName?: string | null;
    variantCaption?: string | null;
    unitSymbol?: string | null;
    memo?: string | null;
    userId?: string | null;
  }): Promise<Purchase> {
    const purchase = this.purchaseRepository.create(data);
    return this.purchaseRepository.save(purchase);
  }

  async 구매에_재고를_연결한다(
    id: string,
    householdId: string,
    inventoryItemId: string,
  ): Promise<Purchase | null> {
    const result = await this.purchaseRepository.update(
      { id, householdId },
      { inventoryItemId },
    );
    if ((result.affected ?? 0) === 0) return null;
    return this.구매를_단건_조회한다(id, householdId);
  }
}
