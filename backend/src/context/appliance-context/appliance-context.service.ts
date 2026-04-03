import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
    ApplianceResult,
    CreateApplianceData,
    UpdateApplianceData,
    MaintenanceScheduleResult,
    CreateMaintenanceScheduleData,
    UpdateMaintenanceScheduleData,
    MaintenanceLogResult,
    CreateMaintenanceLogData,
} from './interfaces/appliance-context.interface';
import { CreateApplianceCommand } from './handlers/commands/create-appliance.handler';
import { UpdateApplianceCommand } from './handlers/commands/update-appliance.handler';
import { RetireApplianceCommand } from './handlers/commands/retire-appliance.handler';
import { CreateMaintenanceScheduleCommand } from './handlers/commands/create-maintenance-schedule.handler';
import { UpdateMaintenanceScheduleCommand } from './handlers/commands/update-maintenance-schedule.handler';
import { DeactivateMaintenanceScheduleCommand } from './handlers/commands/deactivate-maintenance-schedule.handler';
import { CreateMaintenanceLogCommand } from './handlers/commands/create-maintenance-log.handler';
import { GetApplianceListQuery } from './handlers/queries/get-appliance-list.handler';
import { GetApplianceDetailQuery } from './handlers/queries/get-appliance-detail.handler';
import { GetMaintenanceScheduleListQuery } from './handlers/queries/get-maintenance-schedule-list.handler';
import { GetMaintenanceLogListQuery } from './handlers/queries/get-maintenance-log-list.handler';

@Injectable()
export class ApplianceContextService {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    // ── Appliance ──

    async 가전_목록을_조회한다(
        householdId: string,
        status?: 'active' | 'retired',
    ): Promise<ApplianceResult[]> {
        return this.queryBus.execute(
            new GetApplianceListQuery(householdId, status),
        );
    }

    async 가전을_단건_조회한다(
        id: string,
        householdId: string,
    ): Promise<ApplianceResult> {
        return this.queryBus.execute(
            new GetApplianceDetailQuery(id, householdId),
        );
    }

    async 가전을_생성한다(data: CreateApplianceData): Promise<ApplianceResult> {
        return this.commandBus.execute(new CreateApplianceCommand(data));
    }

    async 가전을_수정한다(
        id: string,
        householdId: string,
        data: UpdateApplianceData,
    ): Promise<ApplianceResult> {
        return this.commandBus.execute(
            new UpdateApplianceCommand(id, householdId, data),
        );
    }

    async 가전을_폐기한다(
        id: string,
        householdId: string,
    ): Promise<ApplianceResult> {
        return this.commandBus.execute(
            new RetireApplianceCommand(id, householdId),
        );
    }

    // ── MaintenanceSchedule ──

    async 유지보수_스케줄_목록을_조회한다(
        applianceId: string,
    ): Promise<MaintenanceScheduleResult[]> {
        return this.queryBus.execute(
            new GetMaintenanceScheduleListQuery(applianceId),
        );
    }

    async 유지보수_스케줄을_생성한다(
        householdId: string,
        data: CreateMaintenanceScheduleData,
    ): Promise<MaintenanceScheduleResult> {
        return this.commandBus.execute(
            new CreateMaintenanceScheduleCommand(householdId, data),
        );
    }

    async 유지보수_스케줄을_수정한다(
        id: string,
        applianceId: string,
        data: UpdateMaintenanceScheduleData,
    ): Promise<MaintenanceScheduleResult> {
        return this.commandBus.execute(
            new UpdateMaintenanceScheduleCommand(id, applianceId, data),
        );
    }

    async 유지보수_스케줄을_비활성화한다(
        id: string,
        applianceId: string,
    ): Promise<MaintenanceScheduleResult> {
        return this.commandBus.execute(
            new DeactivateMaintenanceScheduleCommand(id, applianceId),
        );
    }

    // ── MaintenanceLog ──

    async 유지보수_이력_목록을_조회한다(
        applianceId: string,
        type?: string,
    ): Promise<MaintenanceLogResult[]> {
        return this.queryBus.execute(
            new GetMaintenanceLogListQuery(applianceId, type),
        );
    }

    async 유지보수_이력을_생성한다(
        householdId: string,
        data: CreateMaintenanceLogData,
    ): Promise<MaintenanceLogResult> {
        return this.commandBus.execute(
            new CreateMaintenanceLogCommand(householdId, data),
        );
    }
}
