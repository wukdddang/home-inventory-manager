import { BaseService, ServiceResponse } from '../../common/base.service';
import { CATEGORY_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface CreateCategoryRequest {
  name: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  sortOrder?: number;
}

export interface CopyCategoriesRequest {
  sourceHouseholdId: string;
}

// ── Response DTOs ──
export interface Category {
  id: string;
  householdId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export class CategoryService extends BaseService {
  async 카테고리_목록을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<Category[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(CATEGORY_ENDPOINTS.목록_및_생성(householdId), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '카테고리 목록 조회에 실패했습니다.');
      return res.json();
    }, '카테고리 목록 조회에 실패했습니다.');
  }

  async 카테고리를_단건_조회한다(
    householdId: string,
    id: string,
  ): Promise<ServiceResponse<Category>> {
    return this.handleApiCall(async () => {
      const res = await fetch(CATEGORY_ENDPOINTS.단건(householdId, id), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '카테고리 조회에 실패했습니다.');
      return res.json();
    }, '카테고리 조회에 실패했습니다.');
  }

  async 카테고리를_생성한다(
    householdId: string,
    body: CreateCategoryRequest,
  ): Promise<ServiceResponse<Category>> {
    return this.handleApiCall(async () => {
      const res = await fetch(CATEGORY_ENDPOINTS.목록_및_생성(householdId), {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '카테고리 생성에 실패했습니다.');
      return res.json();
    }, '카테고리 생성에 실패했습니다.');
  }

  async 카테고리를_수정한다(
    householdId: string,
    id: string,
    body: UpdateCategoryRequest,
  ): Promise<ServiceResponse<Category>> {
    return this.handleApiCall(async () => {
      const res = await fetch(CATEGORY_ENDPOINTS.단건(householdId, id), {
        method: 'PUT',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '카테고리 수정에 실패했습니다.');
      return res.json();
    }, '카테고리 수정에 실패했습니다.');
  }

  async 카테고리를_삭제한다(
    householdId: string,
    id: string,
  ): Promise<ServiceResponse<void>> {
    return this.handleApiCall(async () => {
      const res = await fetch(CATEGORY_ENDPOINTS.단건(householdId, id), {
        method: 'DELETE',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '카테고리 삭제에 실패했습니다.');
    }, '카테고리 삭제에 실패했습니다.');
  }

  async 다른_거점에서_카테고리를_가져온다(
    householdId: string,
    body: CopyCategoriesRequest,
  ): Promise<ServiceResponse<Category[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(CATEGORY_ENDPOINTS.복사(householdId), {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '카테고리 가져오기에 실패했습니다.');
      return res.json();
    }, '카테고리 가져오기에 실패했습니다.');
  }
}
