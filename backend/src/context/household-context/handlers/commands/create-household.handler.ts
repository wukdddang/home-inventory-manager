import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HouseholdService } from '../../../../domain/household/household.service';
import { HouseholdMemberService } from '../../../../domain/household/household-member.service';
import { HouseholdResult } from '../../interfaces/household-context.interface';

export class CreateHouseholdCommand {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly kind?: string,
  ) {}
}

@CommandHandler(CreateHouseholdCommand)
export class CreateHouseholdHandler
  implements ICommandHandler<CreateHouseholdCommand>
{
  constructor(
    private readonly householdService: HouseholdService,
    private readonly householdMemberService: HouseholdMemberService,
  ) {}

  async execute(command: CreateHouseholdCommand): Promise<HouseholdResult> {
    const household = await this.householdService.거점을_생성한다({
      name: command.name,
      kind: command.kind,
    });

    await this.householdMemberService.멤버를_추가한다({
      userId: command.userId,
      householdId: household.id,
      role: 'admin',
    });

    return {
      id: household.id,
      name: household.name,
      kind: household.kind,
      createdAt: household.createdAt,
      updatedAt: household.updatedAt,
    };
  }
}
