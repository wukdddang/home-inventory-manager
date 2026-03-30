import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { PurchaseBatchWithPurchaseResult } from './interfaces/purchase-batch-context.interface';
import { GetBatchListQuery } from './handlers/queries/get-batch-list.handler';
import { GetExpiringBatchesQuery } from './handlers/queries/get-expiring-batches.handler';
import { GetExpiredBatchesQuery } from './handlers/queries/get-expired-batches.handler';

@Injectable()
export class PurchaseBatchContextService {
  constructor(private readonly queryBus: QueryBus) {}

  async 로트_목록을_조회한다(
    householdId: string,
  ): Promise<PurchaseBatchWithPurchaseResult[]> {
    return this.queryBus.execute(new GetBatchListQuery(householdId));
  }

  async 유통기한_임박_목록을_조회한다(
    householdId: string,
    daysBeforeExpiration: number,
  ): Promise<PurchaseBatchWithPurchaseResult[]> {
    return this.queryBus.execute(
      new GetExpiringBatchesQuery(householdId, daysBeforeExpiration),
    );
  }

  async 만료된_목록을_조회한다(
    householdId: string,
  ): Promise<PurchaseBatchWithPurchaseResult[]> {
    return this.queryBus.execute(
      new GetExpiredBatchesQuery(householdId),
    );
  }
}
