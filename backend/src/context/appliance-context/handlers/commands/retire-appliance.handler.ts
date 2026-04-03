import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ApplianceDomainService } from '../../../../domain/appliance/appliance.service';
import { ApplianceResult } from '../../interfaces/appliance-context.interface';

export class RetireApplianceCommand {
    constructor(
        public readonly id: string,
        public readonly householdId: string,
    ) {}
}

@CommandHandler(RetireApplianceCommand)
export class RetireApplianceHandler
    implements ICommandHandler<RetireApplianceCommand>
{
    constructor(
        private readonly applianceDomainService: ApplianceDomainService,
    ) {}

    async execute(command: RetireApplianceCommand): Promise<ApplianceResult> {
        const appliance = await this.applianceDomainService.가전을_폐기한다(
            command.id,
            command.householdId,
        );

        if (!appliance) {
            throw new NotFoundException('가전을 찾을 수 없습니다.');
        }

        return appliance;
    }
}
