import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariant } from './product-variant.entity';
import { ProductVariantService } from './product-variant.service';

@Module({
    imports: [TypeOrmModule.forFeature([ProductVariant])],
    providers: [ProductVariantService],
    exports: [ProductVariantService],
})
export class ProductVariantModule {}
