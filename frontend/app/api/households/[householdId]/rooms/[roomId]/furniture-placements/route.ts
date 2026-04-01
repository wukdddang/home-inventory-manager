import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/api/_base';
import { SpaceService } from '@/app/api/_backend/modules/space/space.service';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ householdId: string; roomId: string }> };

export async function GET(request: NextRequest, context: Context) {
  const { householdId, roomId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const service = new SpaceService(accessToken);
  const result = await service.가구_목록을_조회한다(householdId, roomId);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}

export async function POST(request: NextRequest, context: Context) {
  const { householdId, roomId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const service = new SpaceService(accessToken);
  const result = await service.가구를_생성한다(householdId, roomId, body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
}
