import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProductService } from '../../../../domain/product/product.service';
import { CategoryService } from '../../../../domain/category/category.service';
import { ProductResult } from '../../interfaces/product-context.interface';

export class CopyProductsCommand {
    constructor(
        public readonly sourceHouseholdId: string,
        public readonly targetHouseholdId: string,
    ) {}
}

@CommandHandler(CopyProductsCommand)
export class CopyProductsHandler
    implements ICommandHandler<CopyProductsCommand>
{
    constructor(
        private readonly productService: ProductService,
        private readonly categoryService: CategoryService,
    ) {}

    async execute(command: CopyProductsCommand): Promise<ProductResult[]> {
        // 1. 원본 거점의 카테고리를 대상 거점으로 복사
        const sourceCategories =
            await this.categoryService.카테고리_목록을_조회한다(
                command.sourceHouseholdId,
            );
        const targetCategories =
            await this.categoryService.카테고리_목록을_조회한다(
                command.targetHouseholdId,
            );

        // 2. 이름 기준으로 카테고리 매핑 (원본 카테고리ID → 대상 카테고리ID)
        const categoryIdMap = new Map<string, string>();
        for (const src of sourceCategories) {
            const match = targetCategories.find((t) => t.name === src.name);
            if (match) {
                categoryIdMap.set(src.id, match.id);
            }
        }

        // 3. 상품 복사 (매핑된 카테고리만)
        const copies = await this.productService.다른_거점에서_상품을_복사한다(
            command.sourceHouseholdId,
            command.targetHouseholdId,
            categoryIdMap,
        );

        return copies.map((product) => ({
            id: product.id,
            householdId: product.householdId,
            categoryId: product.categoryId,
            name: product.name,
            isConsumable: product.isConsumable,
            imageUrl: product.imageUrl,
            description: product.description,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        }));
    }
}
