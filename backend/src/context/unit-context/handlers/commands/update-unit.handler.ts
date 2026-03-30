import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UnitService } from '../../../../domain/unit/unit.service';
import {
    UnitResult,
    UpdateUnitData,
} from '../../interfaces/unit-context.interface';

export class UpdateUnitCommand {
    constructor(
        public readonly id: string,
        public readonly householdId: string,
        public readonly data: UpdateUnitData,
    ) {}
}

@CommandHandler(UpdateUnitCommand)
export class UpdateUnitHandler
    implements ICommandHandler<UpdateUnitCommand>
{
    constructor(private readonly unitService: UnitService) {}

    async execute(command: UpdateUnitCommand): Promise<UnitResult> {
        const unit = await this.unitService.단위를_수정한다(
            command.id,
            command.householdId,
            command.data,
        );

        if (!unit) {
            throw new NotFoundException('단위를 찾을 수 없습니다.');
        }

        return unit;
    }
}
