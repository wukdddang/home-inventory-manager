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
import { NotificationPreferenceBusinessService } from '../../business/notification-preference-business/notification-preference-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { SaveNotificationPreferenceDto } from './dto/save-notification-preference.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';

@Controller('notification-preferences')
@UseGuards(JwtAuthGuard)
export class NotificationPreferenceController {
  constructor(
    private readonly service: NotificationPreferenceBusinessService,
  ) {}

  @Get()
  async 알림_설정_목록을_조회한다(
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.알림_설정_목록을_조회한다(user.userId);
  }

  @Post()
  async 알림_설정을_저장한다(
    @CurrentUser() user: { userId: string },
    @Body() dto: SaveNotificationPreferenceDto,
  ) {
    return this.service.알림_설정을_저장한다({
      userId: user.userId,
      ...dto,
    });
  }

  @Put(':id')
  async 알림_설정을_수정한다(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    return this.service.알림_설정을_수정한다(id, user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async 알림_설정을_삭제한다(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.service.알림_설정을_삭제한다(id, user.userId);
  }
}
