import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/api/_base';
import { NotificationService } from '@/app/api/_backend/modules/notification/notification.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const householdId = searchParams.get('householdId') ?? undefined;

  const service = new NotificationService(accessToken);
  const result = await service.알림_목록을_조회한다(householdId);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
