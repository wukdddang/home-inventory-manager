import { NextResponse } from 'next/server';
import { getAccessToken } from '../../_base';
import { AuthService } from '../../_backend/modules/auth/auth.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const service = new AuthService(accessToken);
  const result = await service.내정보를_조회한다();

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
