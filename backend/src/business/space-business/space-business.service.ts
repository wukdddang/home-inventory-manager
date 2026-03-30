import { Injectable } from '@nestjs/common';
import { SpaceContextService } from '../../context/space-context/space-context.service';
import {
  SaveHouseStructureData,
  SyncRoomsData,
  CreateFurniturePlacementData,
  UpdateFurniturePlacementData,
  CreateStorageLocationData,
  UpdateStorageLocationData,
  HouseStructureResult,
  RoomResult,
  FurniturePlacementResult,
  StorageLocationResult,
} from '../../context/space-context/interfaces/space-context.interface';

@Injectable()
export class SpaceBusinessService {
  constructor(private readonly spaceContextService: SpaceContextService) {}

  // ── 집 구조 ──

  async 집_구조를_저장한다(
    data: SaveHouseStructureData,
  ): Promise<HouseStructureResult> {
    return this.spaceContextService.집_구조를_저장한다(data);
  }

  async 집_구조를_조회한다(
    householdId: string,
  ): Promise<HouseStructureResult | null> {
    return this.spaceContextService.집_구조를_조회한다(householdId);
  }

  // ── 방 ──

  async 방을_동기화한다(data: SyncRoomsData): Promise<RoomResult[]> {
    return this.spaceContextService.방을_동기화한다(data);
  }

  async 방_목록을_조회한다(houseStructureId: string): Promise<RoomResult[]> {
    return this.spaceContextService.방_목록을_조회한다(houseStructureId);
  }

  // ── 가구 ──

  async 가구를_생성한다(
    data: CreateFurniturePlacementData,
  ): Promise<FurniturePlacementResult> {
    return this.spaceContextService.가구를_생성한다(data);
  }

  async 가구를_수정한다(
    id: string,
    data: UpdateFurniturePlacementData,
  ): Promise<FurniturePlacementResult> {
    return this.spaceContextService.가구를_수정한다(id, data);
  }

  async 가구를_삭제한다(id: string): Promise<void> {
    return this.spaceContextService.가구를_삭제한다(id);
  }

  async 가구_목록을_조회한다(
    roomId: string,
  ): Promise<FurniturePlacementResult[]> {
    return this.spaceContextService.가구_목록을_조회한다(roomId);
  }

  // ── 보관 장소 ──

  async 보관장소를_생성한다(
    data: CreateStorageLocationData,
  ): Promise<StorageLocationResult> {
    return this.spaceContextService.보관장소를_생성한다(data);
  }

  async 보관장소를_수정한다(
    id: string,
    householdId: string,
    data: UpdateStorageLocationData,
  ): Promise<StorageLocationResult> {
    return this.spaceContextService.보관장소를_수정한다(id, householdId, data);
  }

  async 보관장소를_삭제한다(
    id: string,
    householdId: string,
  ): Promise<void> {
    return this.spaceContextService.보관장소를_삭제한다(id, householdId);
  }

  async 보관장소_목록을_조회한다(
    householdId: string,
  ): Promise<StorageLocationResult[]> {
    return this.spaceContextService.보관장소_목록을_조회한다(householdId);
  }
}
