import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ApplianceDomainModule } from '../../domain/appliance/appliance.module';
import { ApplianceContextService } from './appliance-context.service';
import { CreateApplianceHandler } from './handlers/commands/create-appliance.handler';
import { UpdateApplianceHandler } from './handlers/commands/update-appliance.handler';
import { RetireApplianceHandler } from './handlers/commands/retire-appliance.handler';
import { CreateMaintenanceScheduleHandler } from './handlers/commands/create-maintenance-schedule.handler';
import { UpdateMaintenanceScheduleHandler } from './handlers/commands/update-maintenance-schedule.handler';
import { DeactivateMaintenanceScheduleHandler } from './handlers/commands/deactivate-maintenance-schedule.handler';
import { CreateMaintenanceLogHandler } from './handlers/commands/create-maintenance-log.handler';
import { GetApplianceListHandler } from './handlers/queries/get-appliance-list.handler';
import { GetApplianceDetailHandler } from './handlers/queries/get-appliance-detail.handler';
import { GetMaintenanceScheduleListHandler } from './handlers/queries/get-maintenance-schedule-list.handler';
import { GetMaintenanceLogListHandler } from './handlers/queries/get-maintenance-log-list.handler';

const CommandHandlers = [
    CreateApplianceHandler,
    UpdateApplianceHandler,
    RetireApplianceHandler,
    CreateMaintenanceScheduleHandler,
    UpdateMaintenanceScheduleHandler,
    DeactivateMaintenanceScheduleHandler,
    CreateMaintenanceLogHandler,
];

const QueryHandlers = [
    GetApplianceListHandler,
    GetApplianceDetailHandler,
    GetMaintenanceScheduleListHandler,
    GetMaintenanceLogListHandler,
];

@Module({
    imports: [CqrsModule, ApplianceDomainModule],
    providers: [ApplianceContextService, ...CommandHandlers, ...QueryHandlers],
    exports: [ApplianceContextService],
})
export class ApplianceContextModule {}
