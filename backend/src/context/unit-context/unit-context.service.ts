import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
    UnitResult,
    CreateUnitData,
    UpdateUnitData,
} from './interfaces/unit-context.interface';
import { CreateUnitCommand } from './handlers/commands/create-unit.handler';
import { UpdateUnitCommand } from './handlers/commands/update-unit.handler';
import { DeleteUnitCommand } from './handlers/commands/delete-unit.handler';
import { CopyUnitsCommand } from './handlers/commands/copy-units.handler';
import { GetUnitListQuery } from './handlers/queries/get-unit-list.handler';
import { GetUnitDetailQuery } from './handlers/queries/get-unit-detail.handler';

@Injectable()
export class UnitContextService {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    async 단위_목록을_조회한다(
        householdId: string,
    ): Promise<UnitResult[]> {
        return this.queryBus.execute(new GetUnitListQuery(householdId));
    }

    async 단위를_단건_조회한다(
        id: string,
        householdId: string,
    ): Promise<UnitResult> {
        return this.queryBus.execute(new GetUnitDetailQuery(id, householdId));
    }

    async 단위를_생성한다(data: CreateUnitData): Promise<UnitResult> {
        return this.commandBus.execute(
            new CreateUnitCommand(
                data.householdId,
                data.symbol,
                data.name,
                data.sortOrder,
            ),
        );
    }

    async 단위를_수정한다(
        id: string,
        householdId: string,
        data: UpdateUnitData,
    ): Promise<UnitResult> {
        return this.commandBus.execute(
            new UpdateUnitCommand(id, householdId, data),
        );
    }

    async 단위를_삭제한다(
        id: string,
        householdId: string,
    ): Promise<void> {
        return this.commandBus.execute(
            new DeleteUnitCommand(id, householdId),
        );
    }

    async 다른_거점에서_단위를_가져온다(
        sourceHouseholdId: string,
        targetHouseholdId: string,
    ): Promise<UnitResult[]> {
        return this.commandBus.execute(
            new CopyUnitsCommand(sourceHouseholdId, targetHouseholdId),
        );
    }
}
