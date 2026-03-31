import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationBusinessService } from '../../business/notification-business/notification-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationBusinessService: NotificationBusinessService,
  ) {}

  @Get()
  async 알림_목록을_조회한다(
    @CurrentUser() user: { userId: string },
    @Query('householdId') householdId?: string,
  ) {
    return this.notificationBusinessService.알림_목록을_조회한다(
      user.userId,
      householdId,
    );
  }

  @Patch(':id/read')
  async 알림을_읽음_처리한다(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationBusinessService.알림을_읽음_처리한다(
      id,
      user.userId,
    );
  }
}
