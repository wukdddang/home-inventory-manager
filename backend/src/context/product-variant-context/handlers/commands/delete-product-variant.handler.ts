import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ProductVariantService } from '../../../../domain/product-variant/product-variant.service';

export class DeleteProductVariantCommand {
    constructor(
        public readonly id: string,
        public readonly productId: string,
    ) {}
}

@CommandHandler(DeleteProductVariantCommand)
export class DeleteProductVariantHandler
    implements ICommandHandler<DeleteProductVariantCommand>
{
    constructor(
        private readonly productVariantService: ProductVariantService,
    ) {}

    async execute(command: DeleteProductVariantCommand): Promise<void> {
        const deleted =
            await this.productVariantService.상품_용량_변형을_삭제한다(
                command.id,
                command.productId,
            );

        if (!deleted) {
            throw new NotFoundException('상품 용량·변형을 찾을 수 없습니다.');
        }
    }
}
