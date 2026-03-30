import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HouseStructureService } from '../../../../domain/house-structure/house-structure.service';
import { HouseStructureResult } from '../../interfaces/space-context.interface';

export class SaveHouseStructureCommand {
  constructor(
    public readonly householdId: string,
    public readonly name: string,
    public readonly structurePayload: Record<string, any>,
    public readonly diagramLayout?: Record<string, any> | null,
  ) {}
}

@CommandHandler(SaveHouseStructureCommand)
export class SaveHouseStructureHandler
  implements ICommandHandler<SaveHouseStructureCommand>
{
  constructor(
    private readonly houseStructureService: HouseStructureService,
  ) {}

  async execute(
    command: SaveHouseStructureCommand,
  ): Promise<HouseStructureResult> {
    const structure = await this.houseStructureService.집_구조를_저장한다({
      householdId: command.householdId,
      name: command.name,
      structurePayload: command.structurePayload,
      diagramLayout: command.diagramLayout,
    });

    return {
      id: structure.id,
      householdId: structure.householdId,
      name: structure.name,
      structurePayload: structure.structurePayload,
      diagramLayout: structure.diagramLayout,
      version: structure.version,
      createdAt: structure.createdAt,
      updatedAt: structure.updatedAt,
    };
  }
}
