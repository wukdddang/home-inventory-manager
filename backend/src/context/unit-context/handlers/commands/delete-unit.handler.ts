import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UnitService } from '../../../../domain/unit/unit.service';

export class DeleteUnitCommand {
    constructor(
        public readonly id: string,
        public readonly householdId: string,
    ) {}
}

@CommandHandler(DeleteUnitCommand)
export class DeleteUnitHandler
    implements ICommandHandler<DeleteUnitCommand>
{
    constructor(private readonly unitService: UnitService) {}

    async execute(command: DeleteUnitCommand): Promise<void> {
        const deleted = await this.unitService.단위를_삭제한다(
            command.id,
            command.householdId,
        );

        if (!deleted) {
            throw new NotFoundException('단위를 찾을 수 없습니다.');
        }
    }
}
