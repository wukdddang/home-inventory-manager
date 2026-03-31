import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ExpirationAlertRuleModule } from '../../domain/expiration-alert-rule/expiration-alert-rule.module';
import { ExpirationAlertRuleContextService } from './expiration-alert-rule-context.service';
import { SaveExpirationAlertRuleHandler } from './handlers/commands/save-expiration-alert-rule.handler';
import { UpdateExpirationAlertRuleHandler } from './handlers/commands/update-expiration-alert-rule.handler';
import { DeleteExpirationAlertRuleHandler } from './handlers/commands/delete-expiration-alert-rule.handler';
import { GetExpirationAlertRuleListHandler } from './handlers/queries/get-expiration-alert-rule-list.handler';

@Module({
  imports: [CqrsModule, ExpirationAlertRuleModule],
  providers: [
    ExpirationAlertRuleContextService,
    SaveExpirationAlertRuleHandler,
    UpdateExpirationAlertRuleHandler,
    DeleteExpirationAlertRuleHandler,
    GetExpirationAlertRuleListHandler,
  ],
  exports: [ExpirationAlertRuleContextService],
})
export class ExpirationAlertRuleContextModule {}
