import { Injectable } from '@nestjs/common';
import { ApplianceContextService } from '../../context/appliance-context/appliance-context.service';
import {
    ApplianceResult,
    CreateApplianceData,
    UpdateApplianceData,
    MaintenanceScheduleResult,
    CreateMaintenanceScheduleData,
    UpdateMaintenanceScheduleData,
    MaintenanceLogResult,
    CreateMaintenanceLogData,
} from '../../context/appliance-context/interfaces/appliance-context.interface';

@Injectable()
export class ApplianceBusinessService {
    constructor(
        private readonly applianceContextService: ApplianceContextService,
    ) {}

    // ── Appliance ──

    async 가전_목록을_조회한다(
        householdId: string,
        status?: 'active' | 'retired',
    ): Promise<ApplianceResult[]> {
        return this.applianceContextService.가전_목록을_조회한다(
            householdId,
            status,
        );
    }

    async 가전을_단건_조회한다(
        id: string,
        householdId: string,
    ): Promise<ApplianceResult> {
        return this.applianceContextService.가전을_단건_조회한다(id, householdId);
    }

    async 가전을_생성한다(data: CreateApplianceData): Promise<ApplianceResult> {
        return this.applianceContextService.가전을_생성한다(data);
    }

    async 가전을_수정한다(
        id: string,
        householdId: string,
        data: UpdateApplianceData,
    ): Promise<ApplianceResult> {
        return this.applianceContextService.가전을_수정한다(
            id,
            householdId,
            data,
        );
    }

    async 가전을_폐기한다(
        id: string,
        householdId: string,
    ): Promise<ApplianceResult> {
        return this.applianceContextService.가전을_폐기한다(id, householdId);
    }

    // ── MaintenanceSchedule ──

    async 유지보수_스케줄_목록을_조회한다(
        applianceId: string,
    ): Promise<MaintenanceScheduleResult[]> {
        return this.applianceContextService.유지보수_스케줄_목록을_조회한다(
            applianceId,
        );
    }

    async 유지보수_스케줄을_생성한다(
        householdId: string,
        data: CreateMaintenanceScheduleData,
    ): Promise<MaintenanceScheduleResult> {
        return this.applianceContextService.유지보수_스케줄을_생성한다(
            householdId,
            data,
        );
    }

    async 유지보수_스케줄을_수정한다(
        id: string,
        applianceId: string,
        data: UpdateMaintenanceScheduleData,
    ): Promise<MaintenanceScheduleResult> {
        return this.applianceContextService.유지보수_스케줄을_수정한다(
            id,
            applianceId,
            data,
        );
    }

    async 유지보수_스케줄을_비활성화한다(
        id: string,
        applianceId: string,
    ): Promise<MaintenanceScheduleResult> {
        return this.applianceContextService.유지보수_스케줄을_비활성화한다(
            id,
            applianceId,
        );
    }

    // ── MaintenanceLog ──

    async 유지보수_이력_목록을_조회한다(
        applianceId: string,
        type?: string,
    ): Promise<MaintenanceLogResult[]> {
        return this.applianceContextService.유지보수_이력_목록을_조회한다(
            applianceId,
            type,
        );
    }

    async 유지보수_이력을_생성한다(
        householdId: string,
        data: CreateMaintenanceLogData,
    ): Promise<MaintenanceLogResult> {
        return this.applianceContextService.유지보수_이력을_생성한다(
            householdId,
            data,
        );
    }
}
