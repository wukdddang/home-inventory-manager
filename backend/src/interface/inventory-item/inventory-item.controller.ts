import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InventoryItemBusinessService } from '../../business/inventory-item-business/inventory-item-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemQuantityDto } from './dto/update-inventory-item-quantity.dto';

@Controller('households/:householdId/inventory-items')
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
export class InventoryItemController {
  constructor(
    private readonly inventoryItemBusinessService: InventoryItemBusinessService,
  ) {}

  @Get()
  async 재고_품목_목록을_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.inventoryItemBusinessService.재고_품목_목록을_조회한다(
      householdId,
    );
  }

  @Post()
  async 재고_품목을_등록한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: CreateInventoryItemDto,
  ) {
    return this.inventoryItemBusinessService.재고_품목을_생성한다({
      productVariantId: dto.productVariantId,
      storageLocationId: dto.storageLocationId,
      quantity: dto.quantity,
      minStockLevel: dto.minStockLevel,
    });
  }

  @Patch(':id/quantity')
  async 재고_수량을_수정한다(
    @Param('householdId', ParseUUIDPipe) _householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemQuantityDto,
  ) {
    return this.inventoryItemBusinessService.재고_수량을_수정한다(
      id,
      dto.quantity,
    );
  }
}
