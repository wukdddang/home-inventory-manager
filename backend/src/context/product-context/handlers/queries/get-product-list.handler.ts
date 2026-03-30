import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ProductService } from '../../../../domain/product/product.service';
import { ProductResult } from '../../interfaces/product-context.interface';

export class GetProductListQuery {
    constructor(public readonly householdId: string) {}
}

@QueryHandler(GetProductListQuery)
export class GetProductListHandler
    implements IQueryHandler<GetProductListQuery>
{
    constructor(private readonly productService: ProductService) {}

    async execute(query: GetProductListQuery): Promise<ProductResult[]> {
        return this.productService.상품_목록을_조회한다(query.householdId);
    }
}
