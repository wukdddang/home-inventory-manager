import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { HouseholdService } from '../../../../domain/household/household.service';

export class DeleteHouseholdCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteHouseholdCommand)
export class DeleteHouseholdHandler
  implements ICommandHandler<DeleteHouseholdCommand>
{
  constructor(private readonly householdService: HouseholdService) {}

  async execute(command: DeleteHouseholdCommand): Promise<void> {
    const deleted = await this.householdService.거점을_삭제한다(command.id);
    if (!deleted) {
      throw new NotFoundException('거점을 찾을 수 없습니다');
    }
  }
}
