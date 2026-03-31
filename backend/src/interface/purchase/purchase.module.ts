import { Module } from '@nestjs/common';
import { PurchaseBusinessModule } from '../../business/purchase-business/purchase-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { PurchaseController } from './purchase.controller';

@Module({
  imports: [PurchaseBusinessModule, HouseholdMemberModule],
  controllers: [PurchaseController],
})
export class PurchaseInterfaceModule {}
