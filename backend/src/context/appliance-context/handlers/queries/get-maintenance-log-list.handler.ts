import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MaintenanceLogDomainService } from '../../../../domain/appliance/maintenance-log.service';
import { MaintenanceLogResult } from '../../interfaces/appliance-context.interface';

export class GetMaintenanceLogListQuery {
    constructor(
        public readonly applianceId: string,
        public readonly type?: string,
    ) {}
}

@QueryHandler(GetMaintenanceLogListQuery)
export class GetMaintenanceLogListHandler
    implements IQueryHandler<GetMaintenanceLogListQuery>
{
    constructor(
        private readonly logDomainService: MaintenanceLogDomainService,
    ) {}

    async execute(
        query: GetMaintenanceLogListQuery,
    ): Promise<MaintenanceLogResult[]> {
        return this.logDomainService.이력_목록을_조회한다(
            query.applianceId,
            query.type,
        );
    }
}
