import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CategoryService } from '../../../../domain/category/category.service';
import { CategoryResult } from '../../interfaces/category-context.interface';

export class GetCategoryListQuery {
  constructor(public readonly householdId: string) {}
}

@QueryHandler(GetCategoryListQuery)
export class GetCategoryListHandler
  implements IQueryHandler<GetCategoryListQuery>
{
  constructor(private readonly categoryService: CategoryService) {}

  async execute(query: GetCategoryListQuery): Promise<CategoryResult[]> {
    return this.categoryService.카테고리_목록을_조회한다(query.householdId);
  }
}
