import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/api/_base';
import { ExpirationAlertRuleService } from '@/app/api/_backend/modules/expiration-alert-rule/expiration-alert-rule.service';

export const dynamic = 'force-dynamic';

type Context = {
  params: Promise<{ householdId: string; ruleId: string }>;
};

export async function PUT(request: NextRequest, context: Context) {
  const { householdId, ruleId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const service = new ExpirationAlertRuleService(accessToken);
  const result = await service.만료_알림_규칙을_수정한다(householdId, ruleId, body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}

export async function DELETE(request: NextRequest, context: Context) {
  const { householdId, ruleId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const service = new ExpirationAlertRuleService(accessToken);
  const result = await service.만료_알림_규칙을_삭제한다(householdId, ruleId);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
