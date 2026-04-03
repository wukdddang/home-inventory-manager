import { Module } from '@nestjs/common';
import { HouseholdBusinessModule } from '../household-business/household-business.module';
import { CategoryBusinessModule } from '../category-business/category-business.module';
import { UnitBusinessModule } from '../unit-business/unit-business.module';
import { ProductBusinessModule } from '../product-business/product-business.module';
import { ProductVariantBusinessModule } from '../product-variant-business/product-variant-business.module';
import { SpaceBusinessModule } from '../space-business/space-business.module';
import { InventoryItemBusinessModule } from '../inventory-item-business/inventory-item-business.module';
import { InventoryLogBusinessModule } from '../inventory-log-business/inventory-log-business.module';
import { PurchaseBusinessModule } from '../purchase-business/purchase-business.module';
import { PurchaseBatchBusinessModule } from '../purchase-batch-business/purchase-batch-business.module';
import { AggregateBusinessService } from './aggregate-business.service';

@Module({
  imports: [
    HouseholdBusinessModule,
    CategoryBusinessModule,
    UnitBusinessModule,
    ProductBusinessModule,
    ProductVariantBusinessModule,
    SpaceBusinessModule,
    InventoryItemBusinessModule,
    InventoryLogBusinessModule,
    PurchaseBusinessModule,
    PurchaseBatchBusinessModule,
  ],
  providers: [AggregateBusinessService],
  exports: [AggregateBusinessService],
})
export class AggregateBusinessModule {}
