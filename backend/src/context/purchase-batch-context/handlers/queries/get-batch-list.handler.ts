import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PurchaseBatchService } from '../../../../domain/purchase-batch/purchase-batch.service';

export class GetBatchListQuery {
  constructor(public readonly householdId: string) {}
}

@QueryHandler(GetBatchListQuery)
export class GetBatchListHandler
  implements IQueryHandler<GetBatchListQuery>
{
  constructor(
    private readonly purchaseBatchService: PurchaseBatchService,
  ) {}

  async execute(query: GetBatchListQuery) {
    return this.purchaseBatchService.거점의_로트_목록을_조회한다(
      query.householdId,
    );
  }
}
