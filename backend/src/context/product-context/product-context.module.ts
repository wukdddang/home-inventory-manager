import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductModule } from '../../domain/product/product.module';
import { CategoryModule } from '../../domain/category/category.module';
import { ProductContextService } from './product-context.service';
import { CreateProductHandler } from './handlers/commands/create-product.handler';
import { UpdateProductHandler } from './handlers/commands/update-product.handler';
import { DeleteProductHandler } from './handlers/commands/delete-product.handler';
import { CopyProductsHandler } from './handlers/commands/copy-products.handler';
import { GetProductListHandler } from './handlers/queries/get-product-list.handler';
import { GetProductDetailHandler } from './handlers/queries/get-product-detail.handler';

const CommandHandlers = [
    CreateProductHandler,
    UpdateProductHandler,
    DeleteProductHandler,
    CopyProductsHandler,
];

const QueryHandlers = [GetProductListHandler, GetProductDetailHandler];

@Module({
    imports: [CqrsModule, ProductModule, CategoryModule],
    providers: [ProductContextService, ...CommandHandlers, ...QueryHandlers],
    exports: [ProductContextService],
})
export class ProductContextModule {}
