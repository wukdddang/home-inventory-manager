import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { CategoryService } from '../../../../domain/category/category.service';
import {
  CategoryResult,
  UpdateCategoryData,
} from '../../interfaces/category-context.interface';

export class UpdateCategoryCommand {
  constructor(
    public readonly id: string,
    public readonly householdId: string,
    public readonly data: UpdateCategoryData,
  ) {}
}

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler
  implements ICommandHandler<UpdateCategoryCommand>
{
  constructor(private readonly categoryService: CategoryService) {}

  async execute(command: UpdateCategoryCommand): Promise<CategoryResult> {
    const category = await this.categoryService.카테고리를_수정한다(
      command.id,
      command.householdId,
      command.data,
    );

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    return category;
  }
}
