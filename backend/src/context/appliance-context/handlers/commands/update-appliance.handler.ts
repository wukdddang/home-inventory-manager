import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ApplianceDomainService } from '../../../../domain/appliance/appliance.service';
import {
    ApplianceResult,
    UpdateApplianceData,
} from '../../interfaces/appliance-context.interface';

export class UpdateApplianceCommand {
    constructor(
        public readonly id: string,
        public readonly householdId: string,
        public readonly data: UpdateApplianceData,
    ) {}
}

@CommandHandler(UpdateApplianceCommand)
export class UpdateApplianceHandler
    implements ICommandHandler<UpdateApplianceCommand>
{
    constructor(
        private readonly applianceDomainService: ApplianceDomainService,
    ) {}

    async execute(command: UpdateApplianceCommand): Promise<ApplianceResult> {
        const appliance = await this.applianceDomainService.가전을_수정한다(
            command.id,
            command.householdId,
            command.data,
        );

        if (!appliance) {
            throw new NotFoundException('가전을 찾을 수 없습니다.');
        }

        return appliance;
    }
}
