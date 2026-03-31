import { Module } from '@nestjs/common';
import { ExpirationAlertRuleContextModule } from '../../context/expiration-alert-rule-context/expiration-alert-rule-context.module';
import { ExpirationAlertRuleBusinessService } from './expiration-alert-rule-business.service';

@Module({
  imports: [ExpirationAlertRuleContextModule],
  providers: [ExpirationAlertRuleBusinessService],
  exports: [ExpirationAlertRuleBusinessService],
})
export class ExpirationAlertRuleBusinessModule {}
