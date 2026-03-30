import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HouseholdKindDefinitionService } from '../../../../domain/household-kind-definition/household-kind-definition.service';

export class SeedKindDefinitionsCommand {
  constructor(public readonly userId: string) {}
}

@CommandHandler(SeedKindDefinitionsCommand)
export class SeedKindDefinitionsHandler
  implements ICommandHandler<SeedKindDefinitionsCommand>
{
  constructor(
    private readonly kindDefinitionService: HouseholdKindDefinitionService,
  ) {}

  async execute(command: SeedKindDefinitionsCommand): Promise<void> {
    await this.kindDefinitionService.기본_유형을_시드한다(command.userId);
  }
}
