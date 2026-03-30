import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProductVariantService } from '../../../../domain/product-variant/product-variant.service';
import { ProductVariantResult } from '../../interfaces/product-variant-context.interface';

export class CreateProductVariantCommand {
    constructor(
        public readonly productId: string,
        public readonly unitId: string,
        public readonly quantityPerUnit: number,
        public readonly name?: string | null,
        public readonly price?: number | null,
        public readonly sku?: string | null,
        public readonly isDefault?: boolean,
    ) {}
}

@CommandHandler(CreateProductVariantCommand)
export class CreateProductVariantHandler
    implements ICommandHandler<CreateProductVariantCommand>
{
    constructor(
        private readonly productVariantService: ProductVariantService,
    ) {}

    async execute(
        command: CreateProductVariantCommand,
    ): Promise<ProductVariantResult> {
        const variant =
            await this.productVariantService.상품_용량_변형을_생성한다({
                productId: command.productId,
                unitId: command.unitId,
                quantityPerUnit: command.quantityPerUnit,
                name: command.name,
                price: command.price,
                sku: command.sku,
                isDefault: command.isDefault,
            });

        return variant;
    }
}
