import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { ProductVariantBusinessService } from '../../business/product-variant-business/product-variant-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Controller('households/:householdId/products/:productId/variants')
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
export class ProductVariantController {
    constructor(
        private readonly productVariantBusinessService: ProductVariantBusinessService,
    ) {}

    @Get()
    async 상품_용량_변형_목록을_조회한다(
        @Param('productId', ParseUUIDPipe) productId: string,
    ) {
        return this.productVariantBusinessService.상품_용량_변형_목록을_조회한다(
            productId,
        );
    }

    @Get(':id')
    async 상품_용량_변형을_단건_조회한다(
        @Param('productId', ParseUUIDPipe) productId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.productVariantBusinessService.상품_용량_변형을_단건_조회한다(
            id,
            productId,
        );
    }

    @Post()
    async 상품_용량_변형을_생성한다(
        @Param('productId', ParseUUIDPipe) productId: string,
        @Body() dto: CreateProductVariantDto,
    ) {
        return this.productVariantBusinessService.상품_용량_변형을_생성한다({
            productId,
            unitId: dto.unitId,
            quantityPerUnit: dto.quantityPerUnit,
            name: dto.name,
            price: dto.price,
            sku: dto.sku,
            isDefault: dto.isDefault,
        });
    }

    @Put(':id')
    async 상품_용량_변형을_수정한다(
        @Param('productId', ParseUUIDPipe) productId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateProductVariantDto,
    ) {
        return this.productVariantBusinessService.상품_용량_변형을_수정한다(
            id,
            productId,
            {
                unitId: dto.unitId,
                quantityPerUnit: dto.quantityPerUnit,
                name: dto.name,
                price: dto.price,
                sku: dto.sku,
                isDefault: dto.isDefault,
            },
        );
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async 상품_용량_변형을_삭제한다(
        @Param('productId', ParseUUIDPipe) productId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        await this.productVariantBusinessService.상품_용량_변형을_삭제한다(
            id,
            productId,
        );
    }
}
