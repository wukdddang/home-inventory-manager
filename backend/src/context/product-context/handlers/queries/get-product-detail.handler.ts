import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ProductService } from '../../../../domain/product/product.service';
import { ProductResult } from '../../interfaces/product-context.interface';

export class GetProductDetailQuery {
    constructor(
        public readonly id: string,
        public readonly householdId: string,
    ) {}
}

@QueryHandler(GetProductDetailQuery)
export class GetProductDetailHandler
    implements IQueryHandler<GetProductDetailQuery>
{
    constructor(private readonly productService: ProductService) {}

    async execute(query: GetProductDetailQuery): Promise<ProductResult> {
        const product = await this.productService.상품을_단건_조회한다(
            query.id,
            query.householdId,
        );

        if (!product) {
            throw new NotFoundException('상품을 찾을 수 없습니다.');
        }

        return product;
    }
}
