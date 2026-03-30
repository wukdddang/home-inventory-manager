import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseBatch } from './purchase-batch.entity';
import { PurchaseBatchService } from './purchase-batch.service';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseBatch])],
  providers: [PurchaseBatchService],
  exports: [PurchaseBatchService],
})
export class PurchaseBatchModule {}
