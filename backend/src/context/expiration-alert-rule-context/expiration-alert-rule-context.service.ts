import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  SaveExpirationAlertRuleData,
  UpdateExpirationAlertRuleData,
  ExpirationAlertRuleResult,
} from './interfaces/expiration-alert-rule-context.interface';
import { SaveExpirationAlertRuleCommand } from './handlers/commands/save-expiration-alert-rule.handler';
import { UpdateExpirationAlertRuleCommand } from './handlers/commands/update-expiration-alert-rule.handler';
import { DeleteExpirationAlertRuleCommand } from './handlers/commands/delete-expiration-alert-rule.handler';
import { GetExpirationAlertRuleListQuery } from './handlers/queries/get-expiration-alert-rule-list.handler';

@Injectable()
export class ExpirationAlertRuleContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async 만료_알림_규칙_목록을_조회한다(householdId: string): Promise<ExpirationAlertRuleResult[]> {
    return this.queryBus.execute(new GetExpirationAlertRuleListQuery(householdId));
  }

  async 만료_알림_규칙을_저장한다(data: SaveExpirationAlertRuleData): Promise<ExpirationAlertRuleResult> {
    return this.commandBus.execute(new SaveExpirationAlertRuleCommand(data));
  }

  async 만료_알림_규칙을_수정한다(id: string, data: UpdateExpirationAlertRuleData): Promise<ExpirationAlertRuleResult> {
    return this.commandBus.execute(new UpdateExpirationAlertRuleCommand(id, data));
  }

  async 만료_알림_규칙을_삭제한다(id: string): Promise<void> {
    return this.commandBus.execute(new DeleteExpirationAlertRuleCommand(id));
  }
}
