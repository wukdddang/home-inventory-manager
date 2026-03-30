import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '../../../../_base';
import { InvitationService } from '../../../../_backend/modules/invitation/invitation.service';

export const dynamic = 'force-dynamic';

type Context = {
  params: Promise<{ householdId: string; invitationId: string }>;
};

export async function DELETE(request: NextRequest, context: Context) {
  const { householdId, invitationId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const service = new InvitationService(accessToken);
  const result = await service.초대를_취소한다(householdId, invitationId);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 204 });
}
