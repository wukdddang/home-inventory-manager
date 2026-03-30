import { Module } from '@nestjs/common';
import { PurchaseContextModule } from '../../context/purchase-context/purchase-context.module';
import { PurchaseBusinessService } from './purchase-business.service';

@Module({
  imports: [PurchaseContextModule],
  providers: [PurchaseBusinessService],
  exports: [PurchaseBusinessService],
})
export class PurchaseBusinessModule {}
