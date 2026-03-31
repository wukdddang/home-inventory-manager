import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PurchaseBatchService } from '../../../../domain/purchase-batch/purchase-batch.service';

export class GetExpiredBatchesQuery {
  constructor(public readonly householdId: string) {}
}

@QueryHandler(GetExpiredBatchesQuery)
export class GetExpiredBatchesHandler
  implements IQueryHandler<GetExpiredBatchesQuery>
{
  constructor(
    private readonly purchaseBatchService: PurchaseBatchService,
  ) {}

  async execute(query: GetExpiredBatchesQuery) {
    return this.purchaseBatchService.만료된_목록을_조회한다(
      query.householdId,
    );
  }
}
