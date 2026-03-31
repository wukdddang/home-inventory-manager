import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '../../../../../_base';
import { ShoppingListService } from '../../../../../_backend/modules/shopping-list/shopping-list.service';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ householdId: string; itemId: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { householdId, itemId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const service = new ShoppingListService(accessToken);
  const result = await service.장보기_항목을_구매_완료_처리한다(householdId, itemId, body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
}
