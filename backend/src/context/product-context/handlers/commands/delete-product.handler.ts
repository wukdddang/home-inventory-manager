import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ProductService } from '../../../../domain/product/product.service';

export class DeleteProductCommand {
    constructor(
        public readonly id: string,
        public readonly householdId: string,
    ) {}
}

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler
    implements ICommandHandler<DeleteProductCommand>
{
    constructor(private readonly productService: ProductService) {}

    async execute(command: DeleteProductCommand): Promise<void> {
        const deleted = await this.productService.상품을_삭제한다(
            command.id,
            command.householdId,
        );

        if (!deleted) {
            throw new NotFoundException('상품을 찾을 수 없습니다.');
        }
    }
}
