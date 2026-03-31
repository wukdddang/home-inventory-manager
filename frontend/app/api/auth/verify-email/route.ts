import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../_backend/modules/auth/auth.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'token 파라미터가 필요합니다.' },
      { status: 400 },
    );
  }

  const service = new AuthService();
  const result = await service.이메일을_인증한다(token);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
