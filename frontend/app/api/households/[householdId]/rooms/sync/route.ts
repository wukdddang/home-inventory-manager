import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '../../../../_base';
import { SpaceService } from '../../../../_backend/modules/space/space.service';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ householdId: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const { householdId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const service = new SpaceService(accessToken);
  const result = await service.방을_동기화한다(householdId, body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
