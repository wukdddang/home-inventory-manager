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
import { PurchaseBusinessService } from '../../business/purchase-business/purchase-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { LinkPurchaseInventoryDto } from './dto/link-purchase-inventory.dto';

@Controller('households/:householdId/purchases')
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
export class PurchaseController {
  constructor(
    private readonly purchaseBusinessService: PurchaseBusinessService,
  ) {}

  @Get()
  async 구매_목록을_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.purchaseBusinessService.구매_목록을_조회한다(householdId);
  }

  @Post()
  async 구매를_등록한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: CreatePurchaseDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.purchaseBusinessService.구매를_등록한다({
      householdId,
      inventoryItemId: dto.inventoryItemId,
      unitPrice: dto.unitPrice,
      purchasedAt: new Date(dto.purchasedAt),
      supplierName: dto.supplierName,
      itemName: dto.itemName,
      variantCaption: dto.variantCaption,
      unitSymbol: dto.unitSymbol,
      memo: dto.memo,
      userId: user.userId,
      batches: dto.batches.map((b) => ({
        quantity: b.quantity,
        expirationDate: b.expirationDate,
      })),
    });
  }

  @Patch(':id/link-inventory')
  async 구매에_재고를_나중에_연결한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkPurchaseInventoryDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.purchaseBusinessService.구매에_재고를_나중에_연결한다(
      id,
      householdId,
      { inventoryItemId: dto.inventoryItemId },
      user.userId,
    );
  }
}
