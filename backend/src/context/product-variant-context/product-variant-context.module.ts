import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductVariantModule } from '../../domain/product-variant/product-variant.module';
import { ProductVariantContextService } from './product-variant-context.service';
import { CreateProductVariantHandler } from './handlers/commands/create-product-variant.handler';
import { UpdateProductVariantHandler } from './handlers/commands/update-product-variant.handler';
import { DeleteProductVariantHandler } from './handlers/commands/delete-product-variant.handler';
import { GetProductVariantListHandler } from './handlers/queries/get-product-variant-list.handler';
import { GetProductVariantDetailHandler } from './handlers/queries/get-product-variant-detail.handler';

const CommandHandlers = [
    CreateProductVariantHandler,
    UpdateProductVariantHandler,
    DeleteProductVariantHandler,
];

const QueryHandlers = [
    GetProductVariantListHandler,
    GetProductVariantDetailHandler,
];

@Module({
    imports: [CqrsModule, ProductVariantModule],
    providers: [
        ProductVariantContextService,
        ...CommandHandlers,
        ...QueryHandlers,
    ],
    exports: [ProductVariantContextService],
})
export class ProductVariantContextModule {}
