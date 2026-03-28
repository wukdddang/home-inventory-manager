import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { CategoryService } from '../../../../domain/category/category.service';
import { CategoryResult } from '../../interfaces/category-context.interface';

export class GetCategoryDetailQuery {
  constructor(
    public readonly id: string,
    public readonly householdId: string,
  ) {}
}

@QueryHandler(GetCategoryDetailQuery)
export class GetCategoryDetailHandler
  implements IQueryHandler<GetCategoryDetailQuery>
{
  constructor(private readonly categoryService: CategoryService) {}

  async execute(query: GetCategoryDetailQuery): Promise<CategoryResult> {
    const category = await this.categoryService.카테고리를_단건_조회한다(
      query.id,
      query.householdId,
    );

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    return category;
  }
}
