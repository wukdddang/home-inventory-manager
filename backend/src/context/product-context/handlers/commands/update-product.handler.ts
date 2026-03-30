import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ProductService } from '../../../../domain/product/product.service';
import {
    ProductResult,
    UpdateProductData,
} from '../../interfaces/product-context.interface';

export class UpdateProductCommand {
    constructor(
        public readonly id: string,
        public readonly householdId: string,
        public readonly data: UpdateProductData,
    ) {}
}

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler
    implements ICommandHandler<UpdateProductCommand>
{
    constructor(private readonly productService: ProductService) {}

    async execute(command: UpdateProductCommand): Promise<ProductResult> {
        const product = await this.productService.상품을_수정한다(
            command.id,
            command.householdId,
            command.data,
        );

        if (!product) {
            throw new NotFoundException('상품을 찾을 수 없습니다.');
        }

        return product;
    }
}
