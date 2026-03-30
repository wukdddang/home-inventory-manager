import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitService } from '../../../../domain/unit/unit.service';
import { UnitResult } from '../../interfaces/unit-context.interface';

export class CreateUnitCommand {
    constructor(
        public readonly householdId: string,
        public readonly symbol: string,
        public readonly name?: string | null,
        public readonly sortOrder?: number,
    ) {}
}

@CommandHandler(CreateUnitCommand)
export class CreateUnitHandler
    implements ICommandHandler<CreateUnitCommand>
{
    constructor(private readonly unitService: UnitService) {}

    async execute(command: CreateUnitCommand): Promise<UnitResult> {
        const unit = await this.unitService.단위를_생성한다({
            householdId: command.householdId,
            symbol: command.symbol,
            name: command.name,
            sortOrder: command.sortOrder,
        });

        return unit;
    }
}
