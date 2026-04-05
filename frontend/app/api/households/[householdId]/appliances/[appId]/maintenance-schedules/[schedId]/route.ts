import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/api/_base';
import { ApplianceService } from '@/app/api/_backend/modules/appliance/appliance.service';

export const dynamic = 'force-dynamic';

type Context = {
  params: Promise<{ householdId: string; appId: string; schedId: string }>;
};

export async function PUT(request: NextRequest, context: Context) {
  const { householdId, appId, schedId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const service = new ApplianceService(accessToken);
  const result = await service.스케줄을_수정한다(householdId, appId, schedId, body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
