import { BaseService, ServiceResponse } from '../../common/base.service';
import { AGGREGATE_ENDPOINTS } from '../../api-endpoints';

export class AggregateService extends BaseService {
  async 대시보드_뷰를_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<unknown>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        AGGREGATE_ENDPOINTS.대시보드뷰(householdId),
        { method: 'GET', headers: this.authHeaders() },
      );
      if (!res.ok)
        await this.parseErrorResponse(res, '대시보드 뷰 조회에 실패했습니다.');
      return res.json();
    }, '대시보드 뷰 조회에 실패했습니다.');
  }

  async 재고_이력을_일괄_조회한다(
    householdId: string,
    from?: string,
    to?: string,
  ): Promise<ServiceResponse<unknown>> {
    return this.handleApiCall(async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(
        `${AGGREGATE_ENDPOINTS.재고이력일괄(householdId)}${qs}`,
        { method: 'GET', headers: this.authHeaders() },
      );
      if (!res.ok)
        await this.parseErrorResponse(
          res,
          '재고 이력 일괄 조회에 실패했습니다.',
        );
      return res.json();
    }, '재고 이력 일괄 조회에 실패했습니다.');
  }

  async 구매_전체를_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<unknown>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        AGGREGATE_ENDPOINTS.구매전체(householdId),
        { method: 'GET', headers: this.authHeaders() },
      );
      if (!res.ok)
        await this.parseErrorResponse(res, '구매 전체 조회에 실패했습니다.');
      return res.json();
    }, '구매 전체 조회에 실패했습니다.');
  }
}
