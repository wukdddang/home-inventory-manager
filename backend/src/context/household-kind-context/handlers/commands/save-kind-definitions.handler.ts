import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HouseholdKindDefinitionService } from '../../../../domain/household-kind-definition/household-kind-definition.service';
import {
  KindDefinitionItem,
  KindDefinitionResult,
} from '../../interfaces/household-kind-context.interface';

export class SaveKindDefinitionsCommand {
  constructor(
    public readonly userId: string,
    public readonly items: KindDefinitionItem[],
  ) {}
}

@CommandHandler(SaveKindDefinitionsCommand)
export class SaveKindDefinitionsHandler
  implements ICommandHandler<SaveKindDefinitionsCommand>
{
  constructor(
    private readonly kindDefinitionService: HouseholdKindDefinitionService,
  ) {}

  async execute(
    command: SaveKindDefinitionsCommand,
  ): Promise<KindDefinitionResult[]> {
    const definitions =
      await this.kindDefinitionService.유형_목록을_일괄_저장한다(
        command.userId,
        command.items,
      );

    return definitions.map((def) => ({
      id: def.id,
      kindId: def.kindId,
      label: def.label,
      sortOrder: def.sortOrder,
      createdAt: def.createdAt,
      updatedAt: def.updatedAt,
    }));
  }
}
