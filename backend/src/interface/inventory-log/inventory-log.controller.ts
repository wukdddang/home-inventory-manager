import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryLogBusinessService } from '../../business/inventory-log-business/inventory-log-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { CreateConsumptionDto } from './dto/create-consumption.dto';
import { CreateWasteDto } from './dto/create-waste.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';

@Controller('households/:householdId/inventory-items/:inventoryItemId/logs')
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
export class InventoryLogController {
  constructor(
    private readonly inventoryLogBusinessService: InventoryLogBusinessService,
  ) {}

  @Get()
  async 재고_변경_이력을_조회한다(
    @Param('householdId', ParseUUIDPipe) _householdId: string,
    @Param('inventoryItemId', ParseUUIDPipe) inventoryItemId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.inventoryLogBusinessService.재고_변경_이력을_조회한다(
      inventoryItemId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Post('consumption')
  async 소비를_등록한다(
    @Param('householdId', ParseUUIDPipe) _householdId: string,
    @Param('inventoryItemId', ParseUUIDPipe) inventoryItemId: string,
    @Body() dto: CreateConsumptionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.inventoryLogBusinessService.소비를_등록한다(
      inventoryItemId,
      dto.quantity,
      user.id,
      dto.memo ?? null,
    );
  }

  @Post('waste')
  async 폐기를_등록한다(
    @Param('householdId', ParseUUIDPipe) _householdId: string,
    @Param('inventoryItemId', ParseUUIDPipe) inventoryItemId: string,
    @Body() dto: CreateWasteDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.inventoryLogBusinessService.폐기를_등록한다(
      inventoryItemId,
      dto.quantity,
      dto.reason ?? null,
      user.id,
      dto.memo ?? null,
    );
  }

  @Post('adjustment')
  async 수량을_수동_조정한다(
    @Param('householdId', ParseUUIDPipe) _householdId: string,
    @Param('inventoryItemId', ParseUUIDPipe) inventoryItemId: string,
    @Body() dto: CreateAdjustmentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.inventoryLogBusinessService.수량을_수동_조정한다(
      inventoryItemId,
      dto.quantityDelta,
      user.id,
      dto.memo ?? null,
    );
  }
}
