import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from './product-variant.entity';

@Injectable()
export class ProductVariantService {
    constructor(
        @InjectRepository(ProductVariant)
        private readonly productVariantRepository: Repository<ProductVariant>,
    ) {}

    async 상품_용량_변형_목록을_조회한다(
        productId: string,
    ): Promise<ProductVariant[]> {
        return this.productVariantRepository.find({
            where: { productId },
            order: { createdAt: 'ASC' },
        });
    }

    async 상품_용량_변형을_단건_조회한다(
        id: string,
        productId: string,
    ): Promise<ProductVariant | null> {
        return this.productVariantRepository.findOne({
            where: { id, productId },
        });
    }

    async 상품_용량_변형을_생성한다(data: {
        productId: string;
        unitId: string;
        quantityPerUnit: number;
        name?: string | null;
        price?: number | null;
        sku?: string | null;
        isDefault?: boolean;
    }): Promise<ProductVariant> {
        const variant = this.productVariantRepository.create(data);
        return this.productVariantRepository.save(variant);
    }

    async 상품_용량_변형을_수정한다(
        id: string,
        productId: string,
        data: {
            unitId?: string;
            quantityPerUnit?: number;
            name?: string | null;
            price?: number | null;
            sku?: string | null;
            isDefault?: boolean;
        },
    ): Promise<ProductVariant | null> {
        const variant = await this.상품_용량_변형을_단건_조회한다(
            id,
            productId,
        );
        if (!variant) return null;

        Object.assign(variant, data);
        return this.productVariantRepository.save(variant);
    }

    async 상품_용량_변형을_삭제한다(
        id: string,
        productId: string,
    ): Promise<boolean> {
        const result = await this.productVariantRepository.delete({
            id,
            productId,
        });
        return (result.affected ?? 0) > 0;
    }
}
