import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ApplianceDomainService } from '../../../../domain/appliance/appliance.service';
import { MaintenanceLogDomainService } from '../../../../domain/appliance/maintenance-log.service';
import { MaintenanceScheduleDomainService } from '../../../../domain/appliance/maintenance-schedule.service';
import {
    CreateMaintenanceLogData,
    MaintenanceLogResult,
} from '../../interfaces/appliance-context.interface';

export class CreateMaintenanceLogCommand {
    constructor(
        public readonly householdId: string,
        public readonly data: CreateMaintenanceLogData,
    ) {}
}

@CommandHandler(CreateMaintenanceLogCommand)
export class CreateMaintenanceLogHandler
    implements ICommandHandler<CreateMaintenanceLogCommand>
{
    constructor(
        private readonly applianceDomainService: ApplianceDomainService,
        private readonly logDomainService: MaintenanceLogDomainService,
        private readonly scheduleDomainService: MaintenanceScheduleDomainService,
    ) {}

    async execute(
        command: CreateMaintenanceLogCommand,
    ): Promise<MaintenanceLogResult> {
        const appliance = await this.applianceDomainService.가전을_단건_조회한다(
            command.data.applianceId,
            command.householdId,
        );

        if (!appliance) {
            throw new NotFoundException('가전을 찾을 수 없습니다.');
        }

        const log = await this.logDomainService.이력을_생성한다(command.data);

        // 정기 유지보수 완료 시 다음 예정일 갱신
        if (command.data.maintenanceScheduleId) {
            const schedule = await this.scheduleDomainService.스케줄을_단건_조회한다(
                command.data.maintenanceScheduleId,
                command.data.applianceId,
            );

            if (schedule && schedule.isActive) {
                const nextDate = this.다음_발생일을_계산한다(
                    command.data.performedAt,
                    schedule.recurrenceRule,
                );
                await this.scheduleDomainService.다음_예정일을_갱신한다(
                    schedule.id,
                    nextDate,
                );
            }
        }

        return log;
    }

    private 다음_발생일을_계산한다(
        currentDate: string,
        rule: {
            frequency: string;
            interval: number;
            dayOfMonth?: number;
            dayOfWeek?: number;
            monthOfYear?: number;
        },
    ): string {
        const date = new Date(currentDate);

        switch (rule.frequency) {
            case 'daily':
                date.setDate(date.getDate() + rule.interval);
                break;
            case 'weekly':
                date.setDate(date.getDate() + rule.interval * 7);
                break;
            case 'monthly': {
                date.setMonth(date.getMonth() + rule.interval);
                if (rule.dayOfMonth) {
                    const lastDay = new Date(
                        date.getFullYear(),
                        date.getMonth() + 1,
                        0,
                    ).getDate();
                    date.setDate(Math.min(rule.dayOfMonth, lastDay));
                }
                break;
            }
            case 'yearly':
                date.setFullYear(date.getFullYear() + rule.interval);
                break;
        }

        return date.toISOString().split('T')[0];
    }
}
