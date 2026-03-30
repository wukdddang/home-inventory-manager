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
  UseGuards,
} from '@nestjs/common';
import { InvitationBusinessService } from '../../business/invitation-business/invitation-business.service';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/auth/decorators/current-user.decorator';
import { Roles } from '../../common/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';
import { RolesGuard } from '../../common/auth/guards/roles.guard';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Controller()
export class InvitationController {
  constructor(
    private readonly invitationBusinessService: InvitationBusinessService,
  ) {}

  // ── 거점 소속 초대 관리 (admin 전용) ──

  @Post('households/:householdId/invitations')
  @UseGuards(JwtAuthGuard, HouseholdMemberGuard, RolesGuard)
  @Roles('admin')
  async 초대를_생성한다(
    @CurrentUser() user: CurrentUserPayload,
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationBusinessService.초대를_생성한다({
      householdId,
      invitedByUserId: user.userId,
      role: dto.role,
      inviteeEmail: dto.inviteeEmail,
      expiresInDays: dto.expiresInDays,
    });
  }

  @Get('households/:householdId/invitations')
  @UseGuards(JwtAuthGuard, HouseholdMemberGuard, RolesGuard)
  @Roles('admin')
  async 초대_목록을_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.invitationBusinessService.초대_목록을_조회한다(householdId);
  }

  @Delete('households/:householdId/invitations/:invitationId')
  @UseGuards(JwtAuthGuard, HouseholdMemberGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async 초대를_취소한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    await this.invitationBusinessService.초대를_취소한다(
      invitationId,
      householdId,
    );
  }

  // ── 토큰 기반 (비인증 조회 / 인증 수락) ──

  @Get('invitations/:token')
  async 토큰으로_초대를_조회한다(@Param('token') token: string) {
    return this.invitationBusinessService.토큰으로_초대를_조회한다(token);
  }

  @Post('invitations/:token/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async 초대를_수락한다(
    @CurrentUser() user: CurrentUserPayload,
    @Param('token') token: string,
  ) {
    await this.invitationBusinessService.초대를_수락한다(
      token,
      user.userId,
      user.email,
    );
    return { message: '초대를 수락했습니다' };
  }
}
