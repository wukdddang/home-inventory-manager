import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnitService } from '../../../../domain/unit/unit.service';
import { UnitResult } from '../../interfaces/unit-context.interface';

export class GetUnitListQuery {
    constructor(public readonly householdId: string) {}
}

@QueryHandler(GetUnitListQuery)
export class GetUnitListHandler
    implements IQueryHandler<GetUnitListQuery>
{
    constructor(private readonly unitService: UnitService) {}

    async execute(query: GetUnitListQuery): Promise<UnitResult[]> {
        return this.unitService.단위_목록을_조회한다(query.householdId);
    }
}
