import { BaseService, ServiceResponse } from '../../common/base.service';
import {
  ROOM_ENDPOINTS,
  HOUSE_STRUCTURE_ENDPOINTS,
  FURNITURE_PLACEMENT_ENDPOINTS,
  STORAGE_LOCATION_ENDPOINTS,
} from '../../api-endpoints';

// ── House Structure DTOs ──
export interface SaveHouseStructureRequest {
  name: string;
  structurePayload: Record<string, unknown>;
  diagramLayout?: Record<string, unknown> | null;
}

export interface HouseStructure {
  id: string;
  householdId: string;
  name: string;
  structurePayload: Record<string, unknown>;
  diagramLayout: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ── Room DTOs ──
export interface SyncRoomItem {
  structureRoomKey: string;
  displayName?: string | null;
  sortOrder: number;
}

export interface SyncRoomsRequest {
  rooms: SyncRoomItem[];
}

export interface Room {
  id: string;
  householdId: string;
  structureRoomKey: string;
  displayName: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ── Furniture Placement DTOs ──
export interface CreateFurniturePlacementRequest {
  label: string;
  productId?: string | null;
  productVariantId?: string | null;
  anchorDirectStorageId?: string | null;
  sortOrder?: number;
  placementPayload?: Record<string, unknown> | null;
}

export interface UpdateFurniturePlacementRequest {
  label?: string;
  productId?: string | null;
  productVariantId?: string | null;
  anchorDirectStorageId?: string | null;
  sortOrder?: number;
  placementPayload?: Record<string, unknown> | null;
}

export interface FurniturePlacement {
  id: string;
  roomId: string;
  label: string;
  productId: string | null;
  productVariantId: string | null;
  anchorDirectStorageId: string | null;
  sortOrder: number;
  placementPayload: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ── Storage Location DTOs ──
export interface CreateStorageLocationRequest {
  name: string;
  roomId?: string | null;
  furniturePlacementId?: string | null;
  sortOrder?: number;
}

export interface UpdateStorageLocationRequest {
  name?: string;
  roomId?: string | null;
  furniturePlacementId?: string | null;
  sortOrder?: number;
}

export interface StorageLocation {
  id: string;
  householdId: string;
  name: string;
  roomId: string | null;
  furniturePlacementId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export class SpaceService extends BaseService {
  // ── House Structure ──

  async 집_구조를_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<HouseStructure>> {
    return this.handleApiCall(async () => {
      const res = await fetch(HOUSE_STRUCTURE_ENDPOINTS.조회_및_저장(householdId), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '집 구조 조회에 실패했습니다.');
      return res.json();
    }, '집 구조 조회에 실패했습니다.');
  }

  async 집_구조를_저장한다(
    householdId: string,
    body: SaveHouseStructureRequest,
  ): Promise<ServiceResponse<HouseStructure>> {
    return this.handleApiCall(async () => {
      const res = await fetch(HOUSE_STRUCTURE_ENDPOINTS.조회_및_저장(householdId), {
        method: 'PUT',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '집 구조 저장에 실패했습니다.');
      return res.json();
    }, '집 구조 저장에 실패했습니다.');
  }

  // ── Rooms ──

  async 방_목록을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<Room[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(ROOM_ENDPOINTS.목록(householdId), {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '방 목록 조회에 실패했습니다.');
      return res.json();
    }, '방 목록 조회에 실패했습니다.');
  }

  async 방을_동기화한다(
    householdId: string,
    body: SyncRoomsRequest,
  ): Promise<ServiceResponse<Room[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(ROOM_ENDPOINTS.동기화(householdId), {
        method: 'PUT',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '방 동기화에 실패했습니다.');
      return res.json();
    }, '방 동기화에 실패했습니다.');
  }

  // ── Furniture Placement ──

  async 가구_목록을_조회한다(
    householdId: string,
    roomId: string,
  ): Promise<ServiceResponse<FurniturePlacement[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        FURNITURE_PLACEMENT_ENDPOINTS.목록_및_생성(householdId, roomId),
        { method: 'GET', headers: this.authHeaders() },
      );
      if (!res.ok) await this.parseErrorResponse(res, '가구 목록 조회에 실패했습니다.');
      return res.json();
    }, '가구 목록 조회에 실패했습니다.');
  }

  async 가구를_생성한다(
    householdId: string,
    roomId: string,
    body: CreateFurniturePlacementRequest,
  ): Promise<ServiceResponse<FurniturePlacement>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        FURNITURE_PLACEMENT_ENDPOINTS.목록_및_생성(householdId, roomId),
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '가구 생성에 실패했습니다.');
      return res.json();
    }, '가구 생성에 실패했습니다.');
  }

  async 가구를_수정한다(
    householdId: string,
    id: string,
    body: UpdateFurniturePlacementRequest,
  ): Promise<ServiceResponse<FurniturePlacement>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        FURNITURE_PLACEMENT_ENDPOINTS.단건(householdId, id),
        {
          method: 'PUT',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '가구 수정에 실패했습니다.');
      return res.json();
    }, '가구 수정에 실패했습니다.');
  }

  async 가구를_삭제한다(
    householdId: string,
    id: string,
  ): Promise<ServiceResponse<void>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        FURNITURE_PLACEMENT_ENDPOINTS.단건(householdId, id),
        { method: 'DELETE', headers: this.authHeaders() },
      );
      if (!res.ok) await this.parseErrorResponse(res, '가구 삭제에 실패했습니다.');
    }, '가구 삭제에 실패했습니다.');
  }

  // ── Storage Location ──

  async 보관장소_목록을_조회한다(
    householdId: string,
  ): Promise<ServiceResponse<StorageLocation[]>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        STORAGE_LOCATION_ENDPOINTS.목록_및_생성(householdId),
        { method: 'GET', headers: this.authHeaders() },
      );
      if (!res.ok) await this.parseErrorResponse(res, '보관장소 목록 조회에 실패했습니다.');
      return res.json();
    }, '보관장소 목록 조회에 실패했습니다.');
  }

  async 보관장소를_생성한다(
    householdId: string,
    body: CreateStorageLocationRequest,
  ): Promise<ServiceResponse<StorageLocation>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        STORAGE_LOCATION_ENDPOINTS.목록_및_생성(householdId),
        {
          method: 'POST',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '보관장소 생성에 실패했습니다.');
      return res.json();
    }, '보관장소 생성에 실패했습니다.');
  }

  async 보관장소를_수정한다(
    householdId: string,
    id: string,
    body: UpdateStorageLocationRequest,
  ): Promise<ServiceResponse<StorageLocation>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        STORAGE_LOCATION_ENDPOINTS.단건(householdId, id),
        {
          method: 'PUT',
          headers: this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) await this.parseErrorResponse(res, '보관장소 수정에 실패했습니다.');
      return res.json();
    }, '보관장소 수정에 실패했습니다.');
  }

  async 보관장소를_삭제한다(
    householdId: string,
    id: string,
  ): Promise<ServiceResponse<void>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        STORAGE_LOCATION_ENDPOINTS.단건(householdId, id),
        { method: 'DELETE', headers: this.authHeaders() },
      );
      if (!res.ok) await this.parseErrorResponse(res, '보관장소 삭제에 실패했습니다.');
    }, '보관장소 삭제에 실패했습니다.');
  }
}
