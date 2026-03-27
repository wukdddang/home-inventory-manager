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
} from '@nestjs/common';
import { CategoryBusinessService } from '../../business/category-business/category-business.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Controller('households/:householdId/categories')
export class CategoryController {
  constructor(
    private readonly categoryBusinessService: CategoryBusinessService,
  ) {}

  @Get()
  async 카테고리_목록을_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
  ) {
    return this.categoryBusinessService.카테고리_목록을_조회한다(householdId);
  }

  @Get(':id')
  async 카테고리를_단건_조회한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoryBusinessService.카테고리를_단건_조회한다(
      id,
      householdId,
    );
  }

  @Post()
  async 카테고리를_생성한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoryBusinessService.카테고리를_생성한다({
      householdId,
      name: dto.name,
      sortOrder: dto.sortOrder,
    });
  }

  @Put(':id')
  async 카테고리를_수정한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryBusinessService.카테고리를_수정한다(id, householdId, {
      name: dto.name,
      sortOrder: dto.sortOrder,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async 카테고리를_삭제한다(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.categoryBusinessService.카테고리를_삭제한다(id, householdId);
  }
}
