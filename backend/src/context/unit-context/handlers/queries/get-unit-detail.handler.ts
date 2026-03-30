import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UnitService } from '../../../../domain/unit/unit.service';
import { UnitResult } from '../../interfaces/unit-context.interface';

export class GetUnitDetailQuery {
    constructor(
        public readonly id: string,
        public readonly householdId: string,
    ) {}
}

@QueryHandler(GetUnitDetailQuery)
export class GetUnitDetailHandler
    implements IQueryHandler<GetUnitDetailQuery>
{
    constructor(private readonly unitService: UnitService) {}

    async execute(query: GetUnitDetailQuery): Promise<UnitResult> {
        const unit = await this.unitService.단위를_단건_조회한다(
            query.id,
            query.householdId,
        );

        if (!unit) {
            throw new NotFoundException('단위를 찾을 수 없습니다.');
        }

        return unit;
    }
}
