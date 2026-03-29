import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { HouseholdService } from '../../../../domain/household/household.service';
import { HouseholdResult } from '../../interfaces/household-context.interface';

export class UpdateHouseholdCommand {
  constructor(
    public readonly id: string,
    public readonly data: { name?: string; kind?: string | null },
  ) {}
}

@CommandHandler(UpdateHouseholdCommand)
export class UpdateHouseholdHandler
  implements ICommandHandler<UpdateHouseholdCommand>
{
  constructor(private readonly householdService: HouseholdService) {}

  async execute(command: UpdateHouseholdCommand): Promise<HouseholdResult> {
    const household = await this.householdService.거점을_수정한다(
      command.id,
      command.data,
    );
    if (!household) {
      throw new NotFoundException('거점을 찾을 수 없습니다');
    }

    return {
      id: household.id,
      name: household.name,
      kind: household.kind,
      createdAt: household.createdAt,
      updatedAt: household.updatedAt,
    };
  }
}
