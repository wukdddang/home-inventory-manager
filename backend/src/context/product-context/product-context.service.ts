import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
    ProductResult,
    CreateProductData,
    UpdateProductData,
} from './interfaces/product-context.interface';
import { CreateProductCommand } from './handlers/commands/create-product.handler';
import { UpdateProductCommand } from './handlers/commands/update-product.handler';
import { DeleteProductCommand } from './handlers/commands/delete-product.handler';
import { CopyProductsCommand } from './handlers/commands/copy-products.handler';
import { GetProductListQuery } from './handlers/queries/get-product-list.handler';
import { GetProductDetailQuery } from './handlers/queries/get-product-detail.handler';

@Injectable()
export class ProductContextService {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    async 상품_목록을_조회한다(
        householdId: string,
    ): Promise<ProductResult[]> {
        return this.queryBus.execute(new GetProductListQuery(householdId));
    }

    async 상품을_단건_조회한다(
        id: string,
        householdId: string,
    ): Promise<ProductResult> {
        return this.queryBus.execute(
            new GetProductDetailQuery(id, householdId),
        );
    }

    async 상품을_생성한다(data: CreateProductData): Promise<ProductResult> {
        return this.commandBus.execute(
            new CreateProductCommand(
                data.householdId,
                data.categoryId,
                data.name,
                data.isConsumable,
                data.imageUrl,
                data.description,
            ),
        );
    }

    async 상품을_수정한다(
        id: string,
        householdId: string,
        data: UpdateProductData,
    ): Promise<ProductResult> {
        return this.commandBus.execute(
            new UpdateProductCommand(id, householdId, data),
        );
    }

    async 상품을_삭제한다(
        id: string,
        householdId: string,
    ): Promise<void> {
        return this.commandBus.execute(
            new DeleteProductCommand(id, householdId),
        );
    }

    async 다른_거점에서_상품을_가져온다(
        sourceHouseholdId: string,
        targetHouseholdId: string,
    ): Promise<ProductResult[]> {
        return this.commandBus.execute(
            new CopyProductsCommand(sourceHouseholdId, targetHouseholdId),
        );
    }
}
