import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '../../../../_base';
import { SpaceService } from '../../../../_backend/modules/space/space.service';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ householdId: string; id: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const { householdId, id } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const service = new SpaceService(accessToken);
  const result = await service.가구를_수정한다(householdId, id, body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}

export async function DELETE(request: NextRequest, context: Context) {
  const { householdId, id } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const service = new SpaceService(accessToken);
  const result = await service.가구를_삭제한다(householdId, id);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 204 });
}
