import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplianceDomainService } from '../../../../domain/appliance/appliance.service';
import {
    ApplianceResult,
    CreateApplianceData,
} from '../../interfaces/appliance-context.interface';

export class CreateApplianceCommand {
    constructor(public readonly data: CreateApplianceData) {}
}

@CommandHandler(CreateApplianceCommand)
export class CreateApplianceHandler
    implements ICommandHandler<CreateApplianceCommand>
{
    constructor(
        private readonly applianceDomainService: ApplianceDomainService,
    ) {}

    async execute(command: CreateApplianceCommand): Promise<ApplianceResult> {
        return this.applianceDomainService.가전을_생성한다(command.data);
    }
}
