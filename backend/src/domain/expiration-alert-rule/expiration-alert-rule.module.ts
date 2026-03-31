import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpirationAlertRule } from './expiration-alert-rule.entity';
import { ExpirationAlertRuleService } from './expiration-alert-rule.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExpirationAlertRule])],
  providers: [ExpirationAlertRuleService],
  exports: [ExpirationAlertRuleService],
})
export class ExpirationAlertRuleModule {}
