import { NextResponse } from 'next/server';
import {
  getAccessToken,
  getRefreshToken,
  clearRefreshTokenCookie,
  evictTokens,
} from '../../_base';
import { AuthService } from '../../_backend/modules/auth/auth.service';

export const dynamic = 'force-dynamic';

export async function POST() {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();

  // 백엔드 로그아웃 호출 (실패해도 로컬 정리는 진행)
  if (accessToken) {
    const service = new AuthService(accessToken);
    await service.로그아웃을_한다();
  }

  // 로컬 정리
  if (refreshToken) evictTokens(refreshToken);
  await clearRefreshTokenCookie();

  return NextResponse.json({
    success: true,
    data: { message: '로그아웃되었습니다.' },
  });
}
