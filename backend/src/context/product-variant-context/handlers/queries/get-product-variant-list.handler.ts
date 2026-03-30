import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ProductVariantService } from '../../../../domain/product-variant/product-variant.service';
import { ProductVariantResult } from '../../interfaces/product-variant-context.interface';

export class GetProductVariantListQuery {
    constructor(public readonly productId: string) {}
}

@QueryHandler(GetProductVariantListQuery)
export class GetProductVariantListHandler
    implements IQueryHandler<GetProductVariantListQuery>
{
    constructor(
        private readonly productVariantService: ProductVariantService,
    ) {}

    async execute(
        query: GetProductVariantListQuery,
    ): Promise<ProductVariantResult[]> {
        return this.productVariantService.상품_용량_변형_목록을_조회한다(
            query.productId,
        );
    }
}
