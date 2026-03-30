import { Module } from '@nestjs/common';
import { PurchaseBatchBusinessModule } from '../../business/purchase-batch-business/purchase-batch-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { PurchaseBatchController } from './purchase-batch.controller';

@Module({
  imports: [PurchaseBatchBusinessModule, HouseholdMemberModule],
  controllers: [PurchaseBatchController],
})
export class PurchaseBatchInterfaceModule {}
