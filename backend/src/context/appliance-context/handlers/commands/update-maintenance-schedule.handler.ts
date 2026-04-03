import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { MaintenanceScheduleDomainService } from '../../../../domain/appliance/maintenance-schedule.service';
import {
    MaintenanceScheduleResult,
    UpdateMaintenanceScheduleData,
} from '../../interfaces/appliance-context.interface';

export class UpdateMaintenanceScheduleCommand {
    constructor(
        public readonly id: string,
        public readonly applianceId: string,
        public readonly data: UpdateMaintenanceScheduleData,
    ) {}
}

@CommandHandler(UpdateMaintenanceScheduleCommand)
export class UpdateMaintenanceScheduleHandler
    implements ICommandHandler<UpdateMaintenanceScheduleCommand>
{
    constructor(
        private readonly scheduleDomainService: MaintenanceScheduleDomainService,
    ) {}

    async execute(
        command: UpdateMaintenanceScheduleCommand,
    ): Promise<MaintenanceScheduleResult> {
        const schedule = await this.scheduleDomainService.스케줄을_수정한다(
            command.id,
            command.applianceId,
            command.data,
        );

        if (!schedule) {
            throw new NotFoundException('유지보수 스케줄을 찾을 수 없습니다.');
        }

        return schedule;
    }
}
