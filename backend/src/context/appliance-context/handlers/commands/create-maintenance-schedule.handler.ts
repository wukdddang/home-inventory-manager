import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApplianceDomainService } from '../../../../domain/appliance/appliance.service';
import { MaintenanceScheduleDomainService } from '../../../../domain/appliance/maintenance-schedule.service';
import {
    CreateMaintenanceScheduleData,
    MaintenanceScheduleResult,
} from '../../interfaces/appliance-context.interface';

export class CreateMaintenanceScheduleCommand {
    constructor(
        public readonly householdId: string,
        public readonly data: CreateMaintenanceScheduleData,
    ) {}
}

@CommandHandler(CreateMaintenanceScheduleCommand)
export class CreateMaintenanceScheduleHandler
    implements ICommandHandler<CreateMaintenanceScheduleCommand>
{
    constructor(
        private readonly applianceDomainService: ApplianceDomainService,
        private readonly scheduleDomainService: MaintenanceScheduleDomainService,
    ) {}

    async execute(
        command: CreateMaintenanceScheduleCommand,
    ): Promise<MaintenanceScheduleResult> {
        const appliance = await this.applianceDomainService.가전을_단건_조회한다(
            command.data.applianceId,
            command.householdId,
        );

        if (!appliance) {
            throw new NotFoundException('가전을 찾을 수 없습니다.');
        }

        if (appliance.status === 'retired') {
            throw new BadRequestException('폐기된 가전에는 스케줄을 추가할 수 없습니다.');
        }

        return this.scheduleDomainService.스케줄을_생성한다(command.data);
    }
}
