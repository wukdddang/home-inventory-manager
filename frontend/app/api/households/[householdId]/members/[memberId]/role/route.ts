import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/api/_base';
import { HouseholdService } from '@/app/api/_backend/modules/household/household.service';

export const dynamic = 'force-dynamic';

type Context = {
  params: Promise<{ householdId: string; memberId: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const { householdId, memberId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const service = new HouseholdService(accessToken);
  const result = await service.멤버_역할을_변경한다(
    householdId,
    memberId,
    body,
  );

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
