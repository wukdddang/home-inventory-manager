import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) {}

    async 상품_목록을_조회한다(householdId: string): Promise<Product[]> {
        return this.productRepository.find({
            where: { householdId },
            order: { createdAt: 'ASC' },
        });
    }

    async 상품을_단건_조회한다(
        id: string,
        householdId: string,
    ): Promise<Product | null> {
        return this.productRepository.findOne({
            where: { id, householdId },
        });
    }

    async 상품을_생성한다(data: {
        householdId: string;
        categoryId: string;
        name: string;
        isConsumable: boolean;
        imageUrl?: string | null;
        description?: string | null;
    }): Promise<Product> {
        const product = this.productRepository.create(data);
        return this.productRepository.save(product);
    }

    async 상품을_수정한다(
        id: string,
        householdId: string,
        data: {
            categoryId?: string;
            name?: string;
            isConsumable?: boolean;
            imageUrl?: string | null;
            description?: string | null;
        },
    ): Promise<Product | null> {
        const product = await this.상품을_단건_조회한다(id, householdId);
        if (!product) return null;

        Object.assign(product, data);
        return this.productRepository.save(product);
    }

    async 상품을_삭제한다(
        id: string,
        householdId: string,
    ): Promise<boolean> {
        const result = await this.productRepository.delete({
            id,
            householdId,
        });
        return (result.affected ?? 0) > 0;
    }

    async 다른_거점에서_상품을_복사한다(
        sourceHouseholdId: string,
        targetHouseholdId: string,
        categoryIdMap: Map<string, string>,
    ): Promise<Product[]> {
        const sourceProducts =
            await this.상품_목록을_조회한다(sourceHouseholdId);

        const copies = sourceProducts
            .filter((p) => categoryIdMap.has(p.categoryId))
            .map((product) =>
                this.productRepository.create({
                    householdId: targetHouseholdId,
                    categoryId: categoryIdMap.get(product.categoryId)!,
                    name: product.name,
                    isConsumable: product.isConsumable,
                    imageUrl: product.imageUrl,
                    description: product.description,
                }),
            );

        if (copies.length === 0) return [];
        return this.productRepository.save(copies);
    }
}
