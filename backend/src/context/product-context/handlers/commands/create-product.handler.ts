import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProductService } from '../../../../domain/product/product.service';
import { ProductResult } from '../../interfaces/product-context.interface';

export class CreateProductCommand {
    constructor(
        public readonly householdId: string,
        public readonly categoryId: string,
        public readonly name: string,
        public readonly isConsumable: boolean,
        public readonly imageUrl?: string | null,
        public readonly description?: string | null,
    ) {}
}

@CommandHandler(CreateProductCommand)
export class CreateProductHandler
    implements ICommandHandler<CreateProductCommand>
{
    constructor(private readonly productService: ProductService) {}

    async execute(command: CreateProductCommand): Promise<ProductResult> {
        const product = await this.productService.상품을_생성한다({
            householdId: command.householdId,
            categoryId: command.categoryId,
            name: command.name,
            isConsumable: command.isConsumable,
            imageUrl: command.imageUrl,
            description: command.description,
        });

        return product;
    }
}
