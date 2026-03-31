import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ExpirationAlertRuleService } from '../../../../domain/expiration-alert-rule/expiration-alert-rule.service';
import { UpdateExpirationAlertRuleData } from '../../interfaces/expiration-alert-rule-context.interface';

export class UpdateExpirationAlertRuleCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateExpirationAlertRuleData,
  ) {}
}

@CommandHandler(UpdateExpirationAlertRuleCommand)
export class UpdateExpirationAlertRuleHandler
  implements ICommandHandler<UpdateExpirationAlertRuleCommand>
{
  constructor(private readonly service: ExpirationAlertRuleService) {}

  async execute(command: UpdateExpirationAlertRuleCommand) {
    const result = await this.service.만료_알림_규칙을_수정한다(command.id, command.data);
    if (!result) throw new NotFoundException('만료 알림 규칙을 찾을 수 없습니다.');
    return result;
  }
}
