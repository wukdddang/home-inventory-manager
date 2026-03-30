import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ExpirationAlertRuleService } from '../../../../domain/expiration-alert-rule/expiration-alert-rule.service';

export class DeleteExpirationAlertRuleCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteExpirationAlertRuleCommand)
export class DeleteExpirationAlertRuleHandler
  implements ICommandHandler<DeleteExpirationAlertRuleCommand>
{
  constructor(private readonly service: ExpirationAlertRuleService) {}

  async execute(command: DeleteExpirationAlertRuleCommand): Promise<void> {
    const deleted = await this.service.만료_알림_규칙을_삭제한다(command.id);
    if (!deleted) throw new NotFoundException('만료 알림 규칙을 찾을 수 없습니다.');
  }
}
