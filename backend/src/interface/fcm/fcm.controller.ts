import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FcmBusinessService } from '../../business/fcm-business/fcm-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { RegisterTokenDto } from './dto/register-token.dto';

@Controller('fcm-tokens')
@UseGuards(JwtAuthGuard)
export class FcmController {
  constructor(
    private readonly fcmBusinessService: FcmBusinessService,
  ) {}

  @Post()
  async 토큰을_등록한다(
    @CurrentUser() user: { userId: string },
    @Body() dto: RegisterTokenDto,
  ) {
    return this.fcmBusinessService.토큰을_등록한다({
      userId: user.userId,
      token: dto.token,
      platform: dto.platform,
      deviceInfo: dto.deviceInfo ?? null,
    });
  }

  @Get()
  async 내_토큰_목록을_조회한다(
    @CurrentUser() user: { userId: string },
  ) {
    return this.fcmBusinessService.내_토큰_목록을_조회한다(user.userId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async 내_토큰을_일괄_삭제한다(
    @CurrentUser() user: { userId: string },
  ) {
    await this.fcmBusinessService.내_토큰을_일괄_삭제한다(user.userId);
  }

  @Delete(':token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async 토큰을_삭제한다(
    @CurrentUser() user: { userId: string },
    @Param('token') token: string,
  ) {
    const deleted = await this.fcmBusinessService.토큰을_삭제한다(
      token,
      user.userId,
    );
    if (!deleted) {
      throw new NotFoundException('해당 토큰을 찾을 수 없습니다.');
    }
  }
}
