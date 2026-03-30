import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '../../../_base';
import { InvitationService } from '../../../_backend/modules/invitation/invitation.service';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ token: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { token } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const service = new InvitationService(accessToken);
  const result = await service.초대를_수락한다(token);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
