import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CategoryResult,
  CreateCategoryData,
  UpdateCategoryData,
} from './interfaces/category-context.interface';
import { CreateCategoryCommand } from './handlers/commands/create-category.handler';
import { UpdateCategoryCommand } from './handlers/commands/update-category.handler';
import { DeleteCategoryCommand } from './handlers/commands/delete-category.handler';
import { GetCategoryListQuery } from './handlers/queries/get-category-list.handler';
import { GetCategoryDetailQuery } from './handlers/queries/get-category-detail.handler';

@Injectable()
export class CategoryContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async 카테고리_목록을_조회한다(
    householdId: string,
  ): Promise<CategoryResult[]> {
    return this.queryBus.execute(new GetCategoryListQuery(householdId));
  }

  async 카테고리를_단건_조회한다(
    id: string,
    householdId: string,
  ): Promise<CategoryResult> {
    return this.queryBus.execute(new GetCategoryDetailQuery(id, householdId));
  }

  async 카테고리를_생성한다(
    data: CreateCategoryData,
  ): Promise<CategoryResult> {
    return this.commandBus.execute(
      new CreateCategoryCommand(data.householdId, data.name, data.sortOrder),
    );
  }

  async 카테고리를_수정한다(
    id: string,
    householdId: string,
    data: UpdateCategoryData,
  ): Promise<CategoryResult> {
    return this.commandBus.execute(
      new UpdateCategoryCommand(id, householdId, data),
    );
  }

  async 카테고리를_삭제한다(
    id: string,
    householdId: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new DeleteCategoryCommand(id, householdId),
    );
  }
}
