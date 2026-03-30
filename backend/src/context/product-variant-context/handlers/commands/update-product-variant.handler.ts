import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ProductVariantService } from '../../../../domain/product-variant/product-variant.service';
import {
    ProductVariantResult,
    UpdateProductVariantData,
} from '../../interfaces/product-variant-context.interface';

export class UpdateProductVariantCommand {
    constructor(
        public readonly id: string,
        public readonly productId: string,
        public readonly data: UpdateProductVariantData,
    ) {}
}

@CommandHandler(UpdateProductVariantCommand)
export class UpdateProductVariantHandler
    implements ICommandHandler<UpdateProductVariantCommand>
{
    constructor(
        private readonly productVariantService: ProductVariantService,
    ) {}

    async execute(
        command: UpdateProductVariantCommand,
    ): Promise<ProductVariantResult> {
        const variant =
            await this.productVariantService.상품_용량_변형을_수정한다(
                command.id,
                command.productId,
                command.data,
            );

        if (!variant) {
            throw new NotFoundException('상품 용량·변형을 찾을 수 없습니다.');
        }

        return variant;
    }
}
