import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplianceDomainService } from '../../../../domain/appliance/appliance.service';
import { ApplianceResult } from '../../interfaces/appliance-context.interface';

export class GetApplianceListQuery {
    constructor(
        public readonly householdId: string,
        public readonly status?: 'active' | 'retired',
    ) {}
}

@QueryHandler(GetApplianceListQuery)
export class GetApplianceListHandler
    implements IQueryHandler<GetApplianceListQuery>
{
    constructor(
        private readonly applianceDomainService: ApplianceDomainService,
    ) {}

    async execute(query: GetApplianceListQuery): Promise<ApplianceResult[]> {
        return this.applianceDomainService.가전_목록을_조회한다(
            query.householdId,
            query.status,
        );
    }
}
