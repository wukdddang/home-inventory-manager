import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/api/_base';
import { ProductVariantService } from '@/app/api/_backend/modules/product-variant/product-variant.service';

export const dynamic = 'force-dynamic';

type Context = {
  params: Promise<{ householdId: string; productId: string; variantId: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  const { householdId, productId, variantId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const service = new ProductVariantService(accessToken);
  const result = await service.변형을_단건_조회한다(householdId, productId, variantId);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}

export async function PUT(request: NextRequest, context: Context) {
  const { householdId, productId, variantId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const body = await request.json();
  const service = new ProductVariantService(accessToken);
  const result = await service.변형을_수정한다(householdId, productId, variantId, body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}

export async function DELETE(request: NextRequest, context: Context) {
  const { householdId, productId, variantId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: '인증 토큰이 필요합니다.' },
      { status: 401 },
    );
  }

  const service = new ProductVariantService(accessToken);
  const result = await service.변형을_삭제한다(householdId, productId, variantId);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
