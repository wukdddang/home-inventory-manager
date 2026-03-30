import { Injectable } from '@nestjs/common';
import { ProductVariantContextService } from '../../context/product-variant-context/product-variant-context.service';
import {
    ProductVariantResult,
    CreateProductVariantData,
    UpdateProductVariantData,
} from '../../context/product-variant-context/interfaces/product-variant-context.interface';

@Injectable()
export class ProductVariantBusinessService {
    constructor(
        private readonly productVariantContextService: ProductVariantContextService,
    ) {}

    async 상품_용량_변형_목록을_조회한다(
        productId: string,
    ): Promise<ProductVariantResult[]> {
        return this.productVariantContextService.상품_용량_변형_목록을_조회한다(
            productId,
        );
    }

    async 상품_용량_변형을_단건_조회한다(
        id: string,
        productId: string,
    ): Promise<ProductVariantResult> {
        return this.productVariantContextService.상품_용량_변형을_단건_조회한다(
            id,
            productId,
        );
    }

    async 상품_용량_변형을_생성한다(
        data: CreateProductVariantData,
    ): Promise<ProductVariantResult> {
        return this.productVariantContextService.상품_용량_변형을_생성한다(
            data,
        );
    }

    async 상품_용량_변형을_수정한다(
        id: string,
        productId: string,
        data: UpdateProductVariantData,
    ): Promise<ProductVariantResult> {
        return this.productVariantContextService.상품_용량_변형을_수정한다(
            id,
            productId,
            data,
        );
    }

    async 상품_용량_변형을_삭제한다(
        id: string,
        productId: string,
    ): Promise<void> {
        return this.productVariantContextService.상품_용량_변형을_삭제한다(
            id,
            productId,
        );
    }
}
