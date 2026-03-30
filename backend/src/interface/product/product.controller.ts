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
import { ProductBusinessService } from '../../business/product-business/product-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CopyProductsDto } from './dto/copy-products.dto';

@Controller('households/:householdId/products')
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
export class ProductController {
    constructor(
        private readonly productBusinessService: ProductBusinessService,
    ) {}

    @Get()
    async 상품_목록을_조회한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
    ) {
        return this.productBusinessService.상품_목록을_조회한다(householdId);
    }

    @Get(':id')
    async 상품을_단건_조회한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.productBusinessService.상품을_단건_조회한다(
            id,
            householdId,
        );
    }

    @Post()
    async 상품을_생성한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Body() dto: CreateProductDto,
    ) {
        return this.productBusinessService.상품을_생성한다({
            householdId,
            categoryId: dto.categoryId,
            name: dto.name,
            isConsumable: dto.isConsumable,
            imageUrl: dto.imageUrl,
            description: dto.description,
        });
    }

    @Put(':id')
    async 상품을_수정한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateProductDto,
    ) {
        return this.productBusinessService.상품을_수정한다(id, householdId, {
            categoryId: dto.categoryId,
            name: dto.name,
            isConsumable: dto.isConsumable,
            imageUrl: dto.imageUrl,
            description: dto.description,
        });
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async 상품을_삭제한다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        await this.productBusinessService.상품을_삭제한다(id, householdId);
    }

    @Post('copy')
    async 다른_거점에서_상품을_가져온다(
        @Param('householdId', ParseUUIDPipe) householdId: string,
        @Body() dto: CopyProductsDto,
    ) {
        return this.productBusinessService.다른_거점에서_상품을_가져온다(
            dto.sourceHouseholdId,
            householdId,
        );
    }
}
