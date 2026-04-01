import { NextResponse } from 'next/server';
import { getAccessToken } from '@/app/api/_base';

export const dynamic = 'force-dynamic';

/**
 * 클라이언트가 명시적으로 토큰 갱신을 요청할 때 사용.
 * 내부적으로 getAccessToken()이 자동 갱신을 처리한다.
 */
export async function POST() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '토큰 갱신에 실패했습니다. 다시 로그인해주세요.' },
      { status: 401 },
    );
  }

  return NextResponse.json({
    success: true,
    data: { message: '토큰이 갱신되었습니다.' },
  });
}
