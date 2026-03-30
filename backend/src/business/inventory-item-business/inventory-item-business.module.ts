import { Module } from '@nestjs/common';
import { InventoryItemContextModule } from '../../context/inventory-item-context/inventory-item-context.module';
import { InventoryItemBusinessService } from './inventory-item-business.service';

@Module({
  imports: [InventoryItemContextModule],
  providers: [InventoryItemBusinessService],
  exports: [InventoryItemBusinessService],
})
export class InventoryItemBusinessModule {}
