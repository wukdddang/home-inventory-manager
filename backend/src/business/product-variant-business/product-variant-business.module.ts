import { Module } from '@nestjs/common';
import { ProductVariantContextModule } from '../../context/product-variant-context/product-variant-context.module';
import { ProductVariantBusinessService } from './product-variant-business.service';

@Module({
    imports: [ProductVariantContextModule],
    providers: [ProductVariantBusinessService],
    exports: [ProductVariantBusinessService],
})
export class ProductVariantBusinessModule {}
