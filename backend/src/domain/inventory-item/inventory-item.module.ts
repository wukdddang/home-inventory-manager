import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from './inventory-item.entity';
import { InventoryItemService } from './inventory-item.service';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem])],
  providers: [InventoryItemService],
  exports: [InventoryItemService],
})
export class InventoryItemModule {}
