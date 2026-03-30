import { Injectable } from '@nestjs/common';
import { PurchaseContextService } from '../../context/purchase-context/purchase-context.service';
import {
  CreatePurchaseData,
  LinkPurchaseInventoryData,
  PurchaseResult,
} from '../../context/purchase-context/interfaces/purchase-context.interface';

@Injectable()
export class PurchaseBusinessService {
  constructor(
    private readonly purchaseContextService: PurchaseContextService,
  ) {}

  async 구매_목록을_조회한다(
    householdId: string,
  ): Promise<PurchaseResult[]> {
    return this.purchaseContextService.구매_목록을_조회한다(householdId);
  }

  async 구매를_등록한다(data: CreatePurchaseData): Promise<PurchaseResult> {
    return this.purchaseContextService.구매를_등록한다(data);
  }

  async 구매에_재고를_나중에_연결한다(
    id: string,
    householdId: string,
    data: LinkPurchaseInventoryData,
    userId: string | null,
  ): Promise<PurchaseResult> {
    return this.purchaseContextService.구매에_재고를_나중에_연결한다(
      id,
      householdId,
      data,
      userId,
    );
  }
}
