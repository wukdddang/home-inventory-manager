import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PurchaseBatchService } from '../../../../domain/purchase-batch/purchase-batch.service';

export class GetExpiringBatchesQuery {
  constructor(
    public readonly householdId: string,
    public readonly daysBeforeExpiration: number,
  ) {}
}

@QueryHandler(GetExpiringBatchesQuery)
export class GetExpiringBatchesHandler
  implements IQueryHandler<GetExpiringBatchesQuery>
{
  constructor(
    private readonly purchaseBatchService: PurchaseBatchService,
  ) {}

  async execute(query: GetExpiringBatchesQuery) {
    return this.purchaseBatchService.유통기한_임박_목록을_조회한다(
      query.householdId,
      query.daysBeforeExpiration,
    );
  }
}
