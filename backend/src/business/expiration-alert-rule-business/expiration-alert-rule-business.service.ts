import { Injectable } from '@nestjs/common';
import { ExpirationAlertRuleContextService } from '../../context/expiration-alert-rule-context/expiration-alert-rule-context.service';
import {
  SaveExpirationAlertRuleData,
  UpdateExpirationAlertRuleData,
  ExpirationAlertRuleResult,
} from '../../context/expiration-alert-rule-context/interfaces/expiration-alert-rule-context.interface';

@Injectable()
export class ExpirationAlertRuleBusinessService {
  constructor(private readonly contextService: ExpirationAlertRuleContextService) {}

  async 만료_알림_규칙_목록을_조회한다(householdId: string): Promise<ExpirationAlertRuleResult[]> {
    return this.contextService.만료_알림_규칙_목록을_조회한다(householdId);
  }

  async 만료_알림_규칙을_저장한다(data: SaveExpirationAlertRuleData): Promise<ExpirationAlertRuleResult> {
    return this.contextService.만료_알림_규칙을_저장한다(data);
  }

  async 만료_알림_규칙을_수정한다(id: string, data: UpdateExpirationAlertRuleData): Promise<ExpirationAlertRuleResult> {
    return this.contextService.만료_알림_규칙을_수정한다(id, data);
  }

  async 만료_알림_규칙을_삭제한다(id: string): Promise<void> {
    return this.contextService.만료_알림_규칙을_삭제한다(id);
  }
}
