import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitService } from '../../../../domain/unit/unit.service';
import { UnitResult } from '../../interfaces/unit-context.interface';

export class CopyUnitsCommand {
    constructor(
        public readonly sourceHouseholdId: string,
        public readonly targetHouseholdId: string,
    ) {}
}

@CommandHandler(CopyUnitsCommand)
export class CopyUnitsHandler
    implements ICommandHandler<CopyUnitsCommand>
{
    constructor(private readonly unitService: UnitService) {}

    async execute(command: CopyUnitsCommand): Promise<UnitResult[]> {
        const copies = await this.unitService.다른_거점에서_단위를_복사한다(
            command.sourceHouseholdId,
            command.targetHouseholdId,
        );

        return copies.map((unit) => ({
            id: unit.id,
            householdId: unit.householdId,
            symbol: unit.symbol,
            name: unit.name,
            sortOrder: unit.sortOrder,
            createdAt: unit.createdAt,
            updatedAt: unit.updatedAt,
        }));
    }
}
