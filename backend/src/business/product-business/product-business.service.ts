import { Injectable } from '@nestjs/common';
import { ProductContextService } from '../../context/product-context/product-context.service';
import {
    ProductResult,
    CreateProductData,
    UpdateProductData,
} from '../../context/product-context/interfaces/product-context.interface';

@Injectable()
export class ProductBusinessService {
    constructor(
        private readonly productContextService: ProductContextService,
    ) {}

    async 상품_목록을_조회한다(
        householdId: string,
    ): Promise<ProductResult[]> {
        return this.productContextService.상품_목록을_조회한다(householdId);
    }

    async 상품을_단건_조회한다(
        id: string,
        householdId: string,
    ): Promise<ProductResult> {
        return this.productContextService.상품을_단건_조회한다(id, householdId);
    }

    async 상품을_생성한다(data: CreateProductData): Promise<ProductResult> {
        return this.productContextService.상품을_생성한다(data);
    }

    async 상품을_수정한다(
        id: string,
        householdId: string,
        data: UpdateProductData,
    ): Promise<ProductResult> {
        return this.productContextService.상품을_수정한다(
            id,
            householdId,
            data,
        );
    }

    async 상품을_삭제한다(
        id: string,
        householdId: string,
    ): Promise<void> {
        return this.productContextService.상품을_삭제한다(id, householdId);
    }

    async 다른_거점에서_상품을_가져온다(
        sourceHouseholdId: string,
        targetHouseholdId: string,
    ): Promise<ProductResult[]> {
        return this.productContextService.다른_거점에서_상품을_가져온다(
            sourceHouseholdId,
            targetHouseholdId,
        );
    }
}
