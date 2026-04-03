import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ApplianceDomainService } from '../../../../domain/appliance/appliance.service';
import { ApplianceResult } from '../../interfaces/appliance-context.interface';

export class GetApplianceDetailQuery {
    constructor(
        public readonly id: string,
        public readonly householdId: string,
    ) {}
}

@QueryHandler(GetApplianceDetailQuery)
export class GetApplianceDetailHandler
    implements IQueryHandler<GetApplianceDetailQuery>
{
    constructor(
        private readonly applianceDomainService: ApplianceDomainService,
    ) {}

    async execute(query: GetApplianceDetailQuery): Promise<ApplianceResult> {
        const appliance = await this.applianceDomainService.가전을_단건_조회한다(
            query.id,
            query.householdId,
        );

        if (!appliance) {
            throw new NotFoundException('가전을 찾을 수 없습니다.');
        }

        return appliance;
    }
}
