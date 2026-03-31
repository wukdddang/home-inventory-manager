import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PurchaseBatchBusinessService } from '../../business/purchase-batch-business/purchase-batch-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';

@Controller('households/:householdId/batches')
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
export class PurchaseBatchController {
  constructor(
    private readonly purchaseBatchBusinessService: PurchaseBatchBusinessService,
  ) {}

  @Get()
  async 로트_목록을_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.purchaseBatchBusinessService.로트_목록을_조회한다(householdId);
  }

  @Get('expiring')
  async 유통기한_임박_목록을_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ) {
    return this.purchaseBatchBusinessService.유통기한_임박_목록을_조회한다(
      householdId,
      days,
    );
  }

  @Get('expired')
  async 만료된_목록을_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.purchaseBatchBusinessService.만료된_목록을_조회한다(householdId);
  }
}
