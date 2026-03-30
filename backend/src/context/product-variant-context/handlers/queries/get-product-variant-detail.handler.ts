import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ProductVariantService } from '../../../../domain/product-variant/product-variant.service';
import { ProductVariantResult } from '../../interfaces/product-variant-context.interface';

export class GetProductVariantDetailQuery {
    constructor(
        public readonly id: string,
        public readonly productId: string,
    ) {}
}

@QueryHandler(GetProductVariantDetailQuery)
export class GetProductVariantDetailHandler
    implements IQueryHandler<GetProductVariantDetailQuery>
{
    constructor(
        private readonly productVariantService: ProductVariantService,
    ) {}

    async execute(
        query: GetProductVariantDetailQuery,
    ): Promise<ProductVariantResult> {
        const variant =
            await this.productVariantService.상품_용량_변형을_단건_조회한다(
                query.id,
                query.productId,
            );

        if (!variant) {
            throw new NotFoundException('상품 용량·변형을 찾을 수 없습니다.');
        }

        return variant;
    }
}
