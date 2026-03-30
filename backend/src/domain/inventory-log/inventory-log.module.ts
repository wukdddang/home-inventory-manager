import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryLog } from './inventory-log.entity';
import { InventoryLogService } from './inventory-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryLog])],
  providers: [InventoryLogService],
  exports: [InventoryLogService],
})
export class InventoryLogModule {}
