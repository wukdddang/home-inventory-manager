import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PurchaseService } from '../../../../domain/purchase/purchase.service';
import { PurchaseBatchService } from '../../../../domain/purchase-batch/purchase-batch.service';
import { PurchaseResult } from '../../interfaces/purchase-context.interface';

export class GetPurchaseListQuery {
  constructor(public readonly householdId: string) {}
}

@QueryHandler(GetPurchaseListQuery)
export class GetPurchaseListHandler
  implements IQueryHandler<GetPurchaseListQuery>
{
  constructor(
    private readonly purchaseService: PurchaseService,
    private readonly purchaseBatchService: PurchaseBatchService,
  ) {}

  async execute(query: GetPurchaseListQuery): Promise<PurchaseResult[]> {
    const purchases =
      await this.purchaseService.구매_목록을_조회한다(query.householdId);

    return Promise.all(
      purchases.map(async (purchase) => {
        const batches =
          await this.purchaseBatchService.로트_목록을_조회한다(purchase.id);
        return {
          ...purchase,
          batches: batches.map((b) => ({
            id: b.id,
            purchaseId: b.purchaseId,
            quantity: Number(b.quantity),
            expirationDate: b.expirationDate,
            createdAt: b.createdAt,
          })),
        };
      }),
    );
  }
}
