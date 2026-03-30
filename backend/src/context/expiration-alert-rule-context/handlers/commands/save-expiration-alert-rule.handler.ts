import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ExpirationAlertRuleService } from '../../../../domain/expiration-alert-rule/expiration-alert-rule.service';
import { SaveExpirationAlertRuleData } from '../../interfaces/expiration-alert-rule-context.interface';

export class SaveExpirationAlertRuleCommand {
  constructor(public readonly data: SaveExpirationAlertRuleData) {}
}

@CommandHandler(SaveExpirationAlertRuleCommand)
export class SaveExpirationAlertRuleHandler
  implements ICommandHandler<SaveExpirationAlertRuleCommand>
{
  constructor(private readonly service: ExpirationAlertRuleService) {}

  async execute(command: SaveExpirationAlertRuleCommand) {
    return this.service.만료_알림_규칙을_저장한다(command.data);
  }
}
