import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/app/api/_backend/modules/auth/auth.service';
import { setRefreshTokenCookie, cacheTokens } from '@/app/api/_base';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const service = new AuthService();
  const result = await service.로그인을_한다(body);

  if (!result.success || !result.data) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 401 },
    );
  }

  const { accessToken, refreshToken } = result.data;

  // refreshToken → httpOnly 쿠키, accessToken → 서버 메모리
  cacheTokens(refreshToken, accessToken);
  await setRefreshTokenCookie(refreshToken);

  return NextResponse.json({
    success: true,
    data: { message: '로그인되었습니다.' },
  });
}
