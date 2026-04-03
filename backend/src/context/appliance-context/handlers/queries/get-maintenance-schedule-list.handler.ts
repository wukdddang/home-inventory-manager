import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MaintenanceScheduleDomainService } from '../../../../domain/appliance/maintenance-schedule.service';
import { MaintenanceScheduleResult } from '../../interfaces/appliance-context.interface';

export class GetMaintenanceScheduleListQuery {
    constructor(public readonly applianceId: string) {}
}

@QueryHandler(GetMaintenanceScheduleListQuery)
export class GetMaintenanceScheduleListHandler
    implements IQueryHandler<GetMaintenanceScheduleListQuery>
{
    constructor(
        private readonly scheduleDomainService: MaintenanceScheduleDomainService,
    ) {}

    async execute(
        query: GetMaintenanceScheduleListQuery,
    ): Promise<MaintenanceScheduleResult[]> {
        return this.scheduleDomainService.스케줄_목록을_조회한다(query.applianceId);
    }
}
