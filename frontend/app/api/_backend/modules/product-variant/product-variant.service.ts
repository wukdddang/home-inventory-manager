import { BaseService, ServiceResponse } from '../../common/base.service';
import { PRODUCT_VARIANT_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface CreateProductVariantRequest {
  unitId: string;
  quantityPerUnit: number;
  name?: string;
  price?: number;
  sku?: string;
  isDefault?: boolean;
}

export interface UpdateProductVariantRequest {
  unitId?: string;
  quantityPerUnit?: number;
  name?: string;
  price?: number;
  sku?: string;
  isDefault?: boolean;
}

// ── Response DTOs ──
export interface ProductVariant {
  id: string;
  productId: string;
  unitId: string;
  quantityPerUnit: number;
  name: string | null;
  price: number | null;
  sku: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ProductVariantService extends BaseService {
  async 변형_목록을_조회한다(
    householdId: string,
    productId: string,
  ): Promise<ServiceResponse<ProductVariant[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        PRODUCT_VARIANT_ENDPOINTS.목록_및_생성(householdId, productId),
        { method: 'GET', headers: this.authHeaders() },
      );
      if (!res.ok) await this.parseErrorResponse(res, '상품 변형 목록 조회에 실패했습니다.');
      return res.json();
    }, '상품 변형 목록 조회에 실패했습니다.');
  }

  async 변형을_단건_조회한다(
    householdId: string,
    productId: string,
    id: string,
  ): Promise<ServiceResponse<ProductVariant>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        PRODUCT_VARIANT_ENDPOINTS.단건(householdId, productId, id),
        { method: 'GET', headers: this.authHeaders() },
      );
      if (!res.ok) await this.parseErrorResponse(res, '상품 변형 조회에 실패했습니다.');
      return res.json();
    }, '상품 변형 조회에 실패했습니다.');
  }

  async 변형을_생성한다(
    householdId: string,
    productId: string,
    body: CreateProductVariantRequest,
  ): Promise<ServiceResponse<ProductVariant>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        PRODUCT_VARIANT_ENDPOINTS.목록_및_생성(householdId, productId),
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '상품 변형 생성에 실패했습니다.');
      return res.json();
    }, '상품 변형 생성에 실패했습니다.');
  }

  async 변형을_수정한다(
    householdId: string,
    productId: string,
    id: string,
    body: UpdateProductVariantRequest,
  ): Promise<ServiceResponse<ProductVariant>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        PRODUCT_VARIANT_ENDPOINTS.단건(householdId, productId, id),
        {
          method: 'PUT',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '상품 변형 수정에 실패했습니다.');
      return res.json();
    }, '상품 변형 수정에 실패했습니다.');
  }

  async 변형을_삭제한다(
    householdId: string,
    productId: string,
    id: string,
  ): Promise<ServiceResponse<void>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        PRODUCT_VARIANT_ENDPOINTS.단건(householdId, productId, id),
        { method: 'DELETE', headers: this.authHeaders() },
      );
      if (!res.ok) await this.parseErrorResponse(res, '상품 변형 삭제에 실패했습니다.');
    }, '상품 변형 삭제에 실패했습니다.');
  }
}
