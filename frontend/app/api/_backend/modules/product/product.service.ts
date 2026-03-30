import { BaseService, ServiceResponse } from '../../common/base.service';
import { PRODUCT_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface CreateProductRequest {
  categoryId: string;
  name: string;
  isConsumable: boolean;
  imageUrl?: string;
  description?: string;
}

export interface UpdateProductRequest {
  categoryId?: string;
  name?: string;
  isConsumable?: boolean;
  imageUrl?: string;
  description?: string;
}

export interface CopyProductsRequest {
  sourceHouseholdId: string;
}

// ── Response DTOs ──
export interface Product {
  id: string;
  householdId: string;
  categoryId: string;
  name: string;
  isConsumable: boolean;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ProductService extends BaseService {
  async 상품_목록을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<Product[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(PRODUCT_ENDPOINTS.목록_및_생성(householdId), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '상품 목록 조회에 실패했습니다.');
      return res.json();
    }, '상품 목록 조회에 실패했습니다.');
  }

  async 상품을_단건_조회한다(
    householdId: string,
    id: string,
  ): Promise<ServiceResponse<Product>> {
    return this.handleApiCall(async () => {
      const res = await fetch(PRODUCT_ENDPOINTS.단건(householdId, id), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '상품 조회에 실패했습니다.');
      return res.json();
    }, '상품 조회에 실패했습니다.');
  }

  async 상품을_생성한다(
    householdId: string,
    body: CreateProductRequest,
  ): Promise<ServiceResponse<Product>> {
    return this.handleApiCall(async () => {
      const res = await fetch(PRODUCT_ENDPOINTS.목록_및_생성(householdId), {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '상품 생성에 실패했습니다.');
      return res.json();
    }, '상품 생성에 실패했습니다.');
  }

  async 상품을_수정한다(
    householdId: string,
    id: string,
    body: UpdateProductRequest,
  ): Promise<ServiceResponse<Product>> {
    return this.handleApiCall(async () => {
      const res = await fetch(PRODUCT_ENDPOINTS.단건(householdId, id), {
        method: 'PUT',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '상품 수정에 실패했습니다.');
      return res.json();
    }, '상품 수정에 실패했습니다.');
  }

  async 상품을_삭제한다(
    householdId: string,
    id: string,
  ): Promise<ServiceResponse<void>> {
    return this.handleApiCall(async () => {
      const res = await fetch(PRODUCT_ENDPOINTS.단건(householdId, id), {
        method: 'DELETE',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '상품 삭제에 실패했습니다.');
    }, '상품 삭제에 실패했습니다.');
  }

  async 다른_거점에서_상품을_가져온다(
    householdId: string,
    body: CopyProductsRequest,
  ): Promise<ServiceResponse<Product[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(PRODUCT_ENDPOINTS.복사(householdId), {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '상품 가져오기에 실패했습니다.');
      return res.json();
    }, '상품 가져오기에 실패했습니다.');
  }
}
