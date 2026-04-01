import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/api/_base';
import { HouseholdService } from '@/app/api/_backend/modules/household/household.service';

export const dynamic = 'force-dynamic';

type Context = {
  params: Promise<{ householdId: string; memberId: string }>;
};

export async function DELETE(request: NextRequest, context: Context) {
  const { householdId, memberId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const service = new HouseholdService(accessToken);
  const result = await service.멤버를_제거한다(householdId, memberId);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
