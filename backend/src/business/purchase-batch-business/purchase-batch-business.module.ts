import { Module } from '@nestjs/common';
import { PurchaseBatchContextModule } from '../../context/purchase-batch-context/purchase-batch-context.module';
import { PurchaseBatchBusinessService } from './purchase-batch-business.service';

@Module({
  imports: [PurchaseBatchContextModule],
  providers: [PurchaseBatchBusinessService],
  exports: [PurchaseBatchBusinessService],
})
export class PurchaseBatchBusinessModule {}
