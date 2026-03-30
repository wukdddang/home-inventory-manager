import { Module } from '@nestjs/common';
import { ExpirationAlertRuleBusinessModule } from '../../business/expiration-alert-rule-business/expiration-alert-rule-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { ExpirationAlertRuleController } from './expiration-alert-rule.controller';

@Module({
  imports: [ExpirationAlertRuleBusinessModule, HouseholdMemberModule],
  controllers: [ExpirationAlertRuleController],
})
export class ExpirationAlertRuleInterfaceModule {}
