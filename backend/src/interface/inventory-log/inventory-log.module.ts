import { Module } from '@nestjs/common';
import { InventoryLogBusinessModule } from '../../business/inventory-log-business/inventory-log-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { InventoryLogController } from './inventory-log.controller';

@Module({
  imports: [InventoryLogBusinessModule, HouseholdMemberModule],
  controllers: [InventoryLogController],
})
export class InventoryLogInterfaceModule {}
