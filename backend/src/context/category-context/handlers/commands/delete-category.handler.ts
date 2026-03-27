import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { CategoryService } from '../../../../domain/category/category.service.js';

export class DeleteCategoryCommand {
  constructor(
    public readonly id: string,
    public readonly householdId: string,
  ) {}
}

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler
  implements ICommandHandler<DeleteCategoryCommand>
{
  constructor(private readonly categoryService: CategoryService) {}

  async execute(command: DeleteCategoryCommand): Promise<void> {
    const deleted = await this.categoryService.카테고리를_삭제한다(
      command.id,
      command.householdId,
    );

    if (!deleted) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }
  }
}
