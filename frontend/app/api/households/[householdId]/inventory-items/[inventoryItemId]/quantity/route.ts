import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/api/_base';
import { InventoryItemService } from '@/app/api/_backend/modules/inventory-item/inventory-item.service';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ householdId: string; inventoryItemId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const { householdId, inventoryItemId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const service = new InventoryItemService(accessToken);
  const result = await service.재고_수량을_수정한다(householdId, inventoryItemId, body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
