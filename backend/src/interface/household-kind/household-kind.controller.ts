import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { HouseholdKindBusinessService } from '../../business/household-kind-business/household-kind-business.service';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { SaveKindDefinitionsDto } from './dto/save-kind-definitions.dto';

@Controller('household-kind-definitions')
@UseGuards(JwtAuthGuard)
export class HouseholdKindController {
  constructor(
    private readonly kindBusinessService: HouseholdKindBusinessService,
  ) {}

  @Get()
  async 유형_목록을_조회한다(@CurrentUser() user: CurrentUserPayload) {
    return this.kindBusinessService.유형_목록을_조회한다(user.userId);
  }

  @Put()
  async 유형_목록을_일괄_저장한다(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SaveKindDefinitionsDto,
  ) {
    return this.kindBusinessService.유형_목록을_일괄_저장한다({
      userId: user.userId,
      items: dto.items,
    });
  }
}
