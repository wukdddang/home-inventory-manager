import { NextRequest, NextResponse } from 'next/server';
import { InvitationService } from '@/app/api/_backend/modules/invitation/invitation.service';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, context: Context) {
  const { token } = await context.params;
  const service = new InvitationService();
  const result = await service.초대를_토큰으로_조회한다(token);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
