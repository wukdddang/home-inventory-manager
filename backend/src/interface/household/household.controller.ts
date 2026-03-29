import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { HouseholdBusinessService } from '../../business/household-business/household-business.service';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';
import { RolesGuard } from '../../common/auth/guards/roles.guard';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ChangeMemberRoleDto } from './dto/change-member-role.dto';

@Controller('households')
@UseGuards(JwtAuthGuard)
export class HouseholdController {
  constructor(
    private readonly householdBusinessService: HouseholdBusinessService,
  ) {}

  @Post()
  async 거점을_생성한다(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateHouseholdDto,
  ) {
    return this.householdBusinessService.거점을_생성한다({
      userId: user.userId,
      name: dto.name,
      kind: dto.kind,
    });
  }

  @Get()
  async 거점_목록을_조회한다(@CurrentUser() user: CurrentUserPayload) {
    return this.householdBusinessService.거점_목록을_조회한다(user.userId);
  }

  @Get(':householdId')
  @UseGuards(HouseholdMemberGuard)
  async 거점_상세를_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.householdBusinessService.거점_상세를_조회한다(householdId);
  }

  @Put(':householdId')
  @UseGuards(HouseholdMemberGuard, RolesGuard)
  @Roles('admin')
  async 거점을_수정한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: UpdateHouseholdDto,
  ) {
    return this.householdBusinessService.거점을_수정한다(householdId, {
      name: dto.name,
      kind: dto.kind,
    });
  }

  @Delete(':householdId')
  @UseGuards(HouseholdMemberGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async 거점을_삭제한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    await this.householdBusinessService.거점을_삭제한다(householdId);
  }

  // ── 멤버 관리 ──

  @Get(':householdId/members')
  @UseGuards(HouseholdMemberGuard)
  async 멤버_목록을_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.householdBusinessService.멤버_목록을_조회한다(householdId);
  }

  @Post(':householdId/members')
  @UseGuards(HouseholdMemberGuard, RolesGuard)
  @Roles('admin')
  async 멤버를_추가한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.householdBusinessService.멤버를_추가한다({
      householdId,
      userId: dto.userId,
      role: dto.role,
    });
  }

  @Patch(':householdId/members/:memberId/role')
  @UseGuards(HouseholdMemberGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async 멤버_역할을_변경한다(
    @CurrentUser() user: CurrentUserPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: ChangeMemberRoleDto,
  ) {
    await this.householdBusinessService.멤버_역할을_변경한다(
      memberId,
      user.userId,
      { role: dto.role },
    );
    return { message: '역할이 변경되었습니다' };
  }

  @Delete(':householdId/members/:memberId')
  @UseGuards(HouseholdMemberGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async 멤버를_제거한다(
    @CurrentUser() user: CurrentUserPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    await this.householdBusinessService.멤버를_제거한다(
      memberId,
      user.userId,
    );
  }
}
