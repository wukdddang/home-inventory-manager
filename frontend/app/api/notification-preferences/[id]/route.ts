import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/api/_base';
import { NotificationPreferenceService } from '@/app/api/_backend/modules/notification-preference/notification-preference.service';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const service = new NotificationPreferenceService(accessToken);
  const result = await service.알림_설정을_수정한다(id, body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}

export async function DELETE(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const service = new NotificationPreferenceService(accessToken);
  const result = await service.알림_설정을_삭제한다(id);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
