import { Injectable } from '@nestjs/common';
import { CategoryContextService } from '../../context/category-context/category-context.service.js';
import {
  CategoryResult,
  CreateCategoryData,
  UpdateCategoryData,
} from '../../context/category-context/interfaces/category-context.interface.js';

@Injectable()
export class CategoryBusinessService {
  constructor(
    private readonly categoryContextService: CategoryContextService,
  ) {}

  async 카테고리_목록을_조회한다(
    householdId: string,
  ): Promise<CategoryResult[]> {
    return this.categoryContextService.카테고리_목록을_조회한다(householdId);
  }

  async 카테고리를_단건_조회한다(
    id: string,
    householdId: string,
  ): Promise<CategoryResult> {
    return this.categoryContextService.카테고리를_단건_조회한다(
      id,
      householdId,
    );
  }

  async 카테고리를_생성한다(
    data: CreateCategoryData,
  ): Promise<CategoryResult> {
    return this.categoryContextService.카테고리를_생성한다(data);
  }

  async 카테고리를_수정한다(
    id: string,
    householdId: string,
    data: UpdateCategoryData,
  ): Promise<CategoryResult> {
    return this.categoryContextService.카테고리를_수정한다(
      id,
      householdId,
      data,
    );
  }

  async 카테고리를_삭제한다(
    id: string,
    householdId: string,
  ): Promise<void> {
    return this.categoryContextService.카테고리를_삭제한다(id, householdId);
  }
}
