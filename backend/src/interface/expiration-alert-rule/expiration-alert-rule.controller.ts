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
import { ExpirationAlertRuleBusinessService } from '../../business/expiration-alert-rule-business/expiration-alert-rule-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { SaveExpirationAlertRuleDto } from './dto/save-expiration-alert-rule.dto';
import { UpdateExpirationAlertRuleDto } from './dto/update-expiration-alert-rule.dto';

@Controller('households/:householdId/expiration-alert-rules')
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
export class ExpirationAlertRuleController {
  constructor(
    private readonly service: ExpirationAlertRuleBusinessService,
  ) {}

  @Get()
  async 만료_알림_규칙_목록을_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.service.만료_알림_규칙_목록을_조회한다(householdId);
  }

  @Post()
  async 만료_알림_규칙을_저장한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: SaveExpirationAlertRuleDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.만료_알림_규칙을_저장한다({
      productId: dto.productId,
      householdId,
      userId: user.userId,
      daysBefore: dto.daysBefore,
      isActive: dto.isActive,
    });
  }

  @Put(':id')
  async 만료_알림_규칙을_수정한다(
    @Param('householdId', ParseUUIDPipe) _householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpirationAlertRuleDto,
  ) {
    return this.service.만료_알림_규칙을_수정한다(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async 만료_알림_규칙을_삭제한다(
    @Param('householdId', ParseUUIDPipe) _householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.service.만료_알림_규칙을_삭제한다(id);
  }
}
