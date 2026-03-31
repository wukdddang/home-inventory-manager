import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '../../../../../_base';
import { PurchaseService } from '../../../../../_backend/modules/purchase/purchase.service';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ householdId: string; purchaseId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const { householdId, purchaseId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const service = new PurchaseService(accessToken);
  const result = await service.구매에_재고를_나중에_연결한다(householdId, purchaseId, body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
