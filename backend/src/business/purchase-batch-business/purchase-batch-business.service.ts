import { Injectable } from '@nestjs/common';
import { PurchaseBatchContextService } from '../../context/purchase-batch-context/purchase-batch-context.service';
import { PurchaseBatchWithPurchaseResult } from '../../context/purchase-batch-context/interfaces/purchase-batch-context.interface';

@Injectable()
export class PurchaseBatchBusinessService {
  constructor(
    private readonly purchaseBatchContextService: PurchaseBatchContextService,
  ) {}

  async 로트_목록을_조회한다(
    householdId: string,
  ): Promise<PurchaseBatchWithPurchaseResult[]> {
    return this.purchaseBatchContextService.로트_목록을_조회한다(householdId);
  }

  async 유통기한_임박_목록을_조회한다(
    householdId: string,
    daysBeforeExpiration: number,
  ): Promise<PurchaseBatchWithPurchaseResult[]> {
    return this.purchaseBatchContextService.유통기한_임박_목록을_조회한다(
      householdId,
      daysBeforeExpiration,
    );
  }

  async 만료된_목록을_조회한다(
    householdId: string,
  ): Promise<PurchaseBatchWithPurchaseResult[]> {
    return this.purchaseBatchContextService.만료된_목록을_조회한다(householdId);
  }
}
