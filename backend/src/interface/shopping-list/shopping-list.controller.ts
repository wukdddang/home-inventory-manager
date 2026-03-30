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
import { ShoppingListBusinessService } from '../../business/shopping-list-business/shopping-list-business.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/auth/guards/household-member.guard';
import { CurrentUser } from '../../common/auth/decorators/current-user.decorator';
import { CreateShoppingListItemDto } from './dto/create-shopping-list-item.dto';
import { UpdateShoppingListItemDto } from './dto/update-shopping-list-item.dto';
import { CompleteShoppingListItemDto } from './dto/complete-shopping-list-item.dto';

@Controller('households/:householdId/shopping-list-items')
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
export class ShoppingListController {
  constructor(
    private readonly shoppingListBusinessService: ShoppingListBusinessService,
  ) {}

  @Get()
  async 장보기_항목_목록을_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.shoppingListBusinessService.장보기_항목_목록을_조회한다(
      householdId,
    );
  }

  @Post()
  async 장보기_항목을_추가한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: CreateShoppingListItemDto,
  ) {
    return this.shoppingListBusinessService.장보기_항목을_추가한다({
      householdId,
      ...dto,
    });
  }

  @Put(':id')
  async 장보기_항목을_수정한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShoppingListItemDto,
  ) {
    return this.shoppingListBusinessService.장보기_항목을_수정한다(
      id,
      householdId,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async 장보기_항목을_삭제한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.shoppingListBusinessService.장보기_항목을_삭제한다(
      id,
      householdId,
    );
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async 장보기_항목을_구매_완료_처리한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteShoppingListItemDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.shoppingListBusinessService.장보기_항목을_구매_완료_처리한다(
      id,
      householdId,
      dto.inventoryItemId,
      dto.quantity,
      dto.memo ?? null,
      user.userId,
    );
  }
}
