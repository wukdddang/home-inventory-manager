import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CategoryService } from '../../../../domain/category/category.service';
import { CategoryResult } from '../../interfaces/category-context.interface';

export class CreateCategoryCommand {
  constructor(
    public readonly householdId: string,
    public readonly name: string,
    public readonly sortOrder?: number,
  ) {}
}

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler
  implements ICommandHandler<CreateCategoryCommand>
{
  constructor(private readonly categoryService: CategoryService) {}

  async execute(command: CreateCategoryCommand): Promise<CategoryResult> {
    const category = await this.categoryService.카테고리를_생성한다({
      householdId: command.householdId,
      name: command.name,
      sortOrder: command.sortOrder,
    });

    return category;
  }
}
