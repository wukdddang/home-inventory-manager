import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExpirationAlertRuleService } from '../../../../domain/expiration-alert-rule/expiration-alert-rule.service';

export class GetExpirationAlertRuleListQuery {
  constructor(public readonly householdId: string) {}
}

@QueryHandler(GetExpirationAlertRuleListQuery)
export class GetExpirationAlertRuleListHandler
  implements IQueryHandler<GetExpirationAlertRuleListQuery>
{
  constructor(private readonly service: ExpirationAlertRuleService) {}

  async execute(query: GetExpirationAlertRuleListQuery) {
    return this.service.만료_알림_규칙_목록을_조회한다(query.householdId);
  }
}
