import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
    ProductVariantResult,
    CreateProductVariantData,
    UpdateProductVariantData,
} from './interfaces/product-variant-context.interface';
import { CreateProductVariantCommand } from './handlers/commands/create-product-variant.handler';
import { UpdateProductVariantCommand } from './handlers/commands/update-product-variant.handler';
import { DeleteProductVariantCommand } from './handlers/commands/delete-product-variant.handler';
import { GetProductVariantListQuery } from './handlers/queries/get-product-variant-list.handler';
import { GetProductVariantDetailQuery } from './handlers/queries/get-product-variant-detail.handler';

@Injectable()
export class ProductVariantContextService {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    async 상품_용량_변형_목록을_조회한다(
        productId: string,
    ): Promise<ProductVariantResult[]> {
        return this.queryBus.execute(
            new GetProductVariantListQuery(productId),
        );
    }

    async 상품_용량_변형을_단건_조회한다(
        id: string,
        productId: string,
    ): Promise<ProductVariantResult> {
        return this.queryBus.execute(
            new GetProductVariantDetailQuery(id, productId),
        );
    }

    async 상품_용량_변형을_생성한다(
        data: CreateProductVariantData,
    ): Promise<ProductVariantResult> {
        return this.commandBus.execute(
            new CreateProductVariantCommand(
                data.productId,
                data.unitId,
                data.quantityPerUnit,
                data.name,
                data.price,
                data.sku,
                data.isDefault,
            ),
        );
    }

    async 상품_용량_변형을_수정한다(
        id: string,
        productId: string,
        data: UpdateProductVariantData,
    ): Promise<ProductVariantResult> {
        return this.commandBus.execute(
            new UpdateProductVariantCommand(id, productId, data),
        );
    }

    async 상품_용량_변형을_삭제한다(
        id: string,
        productId: string,
    ): Promise<void> {
        return this.commandBus.execute(
            new DeleteProductVariantCommand(id, productId),
        );
    }
}
