import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '../../../../_base';
import { UnitService } from '../../../../_backend/modules/unit/unit.service';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ householdId: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { householdId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const service = new UnitService(accessToken);
  const result = await service.다른_거점에서_단위를_가져온다(householdId, body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
}
