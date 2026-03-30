import { Module } from '@nestjs/common';
import { ProductContextModule } from '../../context/product-context/product-context.module';
import { ProductBusinessService } from './product-business.service';

@Module({
    imports: [ProductContextModule],
    providers: [ProductBusinessService],
    exports: [ProductBusinessService],
})
export class ProductBusinessModule {}
