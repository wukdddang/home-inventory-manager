import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PurchaseBatchModule } from '../../domain/purchase-batch/purchase-batch.module';
import { PurchaseBatchContextService } from './purchase-batch-context.service';
import { GetBatchListHandler } from './handlers/queries/get-batch-list.handler';
import { GetExpiringBatchesHandler } from './handlers/queries/get-expiring-batches.handler';
import { GetExpiredBatchesHandler } from './handlers/queries/get-expired-batches.handler';

const QueryHandlers = [
  GetBatchListHandler,
  GetExpiringBatchesHandler,
  GetExpiredBatchesHandler,
];

@Module({
  imports: [CqrsModule, PurchaseBatchModule],
  providers: [PurchaseBatchContextService, ...QueryHandlers],
  exports: [PurchaseBatchContextService],
})
export class PurchaseBatchContextModule {}
