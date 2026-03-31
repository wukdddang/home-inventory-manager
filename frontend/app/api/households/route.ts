import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '../_base';
import { HouseholdService } from '../_backend/modules/household/household.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const service = new HouseholdService(accessToken);
  const result = await service.거점_목록을_조회한다();

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const service = new HouseholdService(accessToken);
  const result = await service.거점을_생성한다(body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
}
