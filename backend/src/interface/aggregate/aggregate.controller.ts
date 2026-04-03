import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';
import { AggregateBusinessService } from '../../business/aggregate-business/aggregate-business.service';

@Controller('households/:householdId')
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
export class AggregateController {
  constructor(
    private readonly aggregateBusinessService: AggregateBusinessService,
  ) {}

  /**
   * 대시보드 초기 렌더에 필요한 거점 전체 데이터를 한 번에 반환한다.
   */
  @Get('dashboard-view')
  async 대시보드_뷰를_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.aggregateBusinessService.대시보드_뷰를_조회한다(householdId);
  }

  /**
   * 거점의 모든 재고 변경 이력을 한 번에 반환한다.
   */
  @Get('inventory-logs')
  async 거점_재고_이력을_일괄_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const logs =
      await this.aggregateBusinessService.거점_재고_이력을_일괄_조회한다(
        householdId,
      );

    if (from || to) {
      const fromDate = from ? new Date(from) : new Date(0);
      const toDate = to ? new Date(to) : new Date('9999-12-31');
      return logs.filter((log) => {
        const d = new Date(log.createdAt);
        return d >= fromDate && d <= toDate;
      });
    }

    return logs;
  }

  /**
   * 거점의 구매 목록을 배치(로트) 포함하여 한 번에 반환한다.
   */
  @Get('purchases-full')
  async 구매_전체를_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.aggregateBusinessService.구매_전체를_조회한다(householdId);
  }
}
