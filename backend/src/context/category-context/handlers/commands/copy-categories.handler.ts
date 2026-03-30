import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CategoryService } from '../../../../domain/category/category.service';
import { CategoryResult } from '../../interfaces/category-context.interface';

export class CopyCategoriesCommand {
  constructor(
    public readonly sourceHouseholdId: string,
    public readonly targetHouseholdId: string,
  ) {}
}

@CommandHandler(CopyCategoriesCommand)
export class CopyCategoriesHandler
  implements ICommandHandler<CopyCategoriesCommand>
{
  constructor(private readonly categoryService: CategoryService) {}

  async execute(command: CopyCategoriesCommand): Promise<CategoryResult[]> {
    const copies = await this.categoryService.다른_거점에서_카테고리를_복사한다(
      command.sourceHouseholdId,
      command.targetHouseholdId,
    );

    return copies.map((cat) => ({
      id: cat.id,
      householdId: cat.householdId,
      name: cat.name,
      sortOrder: cat.sortOrder,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  }
}
