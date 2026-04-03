import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { MaintenanceScheduleDomainService } from '../../../../domain/appliance/maintenance-schedule.service';
import { MaintenanceScheduleResult } from '../../interfaces/appliance-context.interface';

export class DeactivateMaintenanceScheduleCommand {
    constructor(
        public readonly id: string,
        public readonly applianceId: string,
    ) {}
}

@CommandHandler(DeactivateMaintenanceScheduleCommand)
export class DeactivateMaintenanceScheduleHandler
    implements ICommandHandler<DeactivateMaintenanceScheduleCommand>
{
    constructor(
        private readonly scheduleDomainService: MaintenanceScheduleDomainService,
    ) {}

    async execute(
        command: DeactivateMaintenanceScheduleCommand,
    ): Promise<MaintenanceScheduleResult> {
        const schedule = await this.scheduleDomainService.스케줄을_비활성화한다(
            command.id,
            command.applianceId,
        );

        if (!schedule) {
            throw new NotFoundException('유지보수 스케줄을 찾을 수 없습니다.');
        }

        return schedule;
    }
}
