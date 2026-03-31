import { Module } from '@nestjs/common';
import { InventoryItemBusinessModule } from '../../business/inventory-item-business/inventory-item-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { InventoryItemController } from './inventory-item.controller';

@Module({
  imports: [InventoryItemBusinessModule, HouseholdMemberModule],
  controllers: [InventoryItemController],
})
export class InventoryItemInterfaceModule {}
