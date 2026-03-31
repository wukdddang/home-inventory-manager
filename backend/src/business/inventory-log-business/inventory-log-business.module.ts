import { Module } from '@nestjs/common';
import { InventoryLogContextModule } from '../../context/inventory-log-context/inventory-log-context.module';
import { InventoryLogBusinessService } from './inventory-log-business.service';

@Module({
  imports: [InventoryLogContextModule],
  providers: [InventoryLogBusinessService],
  exports: [InventoryLogBusinessService],
})
export class InventoryLogBusinessModule {}
