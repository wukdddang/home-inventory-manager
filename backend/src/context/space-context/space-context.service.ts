import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
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
} from './interfaces/space-context.interface';
import { SaveHouseStructureCommand } from './handlers/commands/save-house-structure.handler';
import { SyncRoomsCommand } from './handlers/commands/sync-rooms.handler';
import { CreateFurniturePlacementCommand } from './handlers/commands/create-furniture-placement.handler';
import { UpdateFurniturePlacementCommand } from './handlers/commands/update-furniture-placement.handler';
import { DeleteFurniturePlacementCommand } from './handlers/commands/delete-furniture-placement.handler';
import { CreateStorageLocationCommand } from './handlers/commands/create-storage-location.handler';
import { UpdateStorageLocationCommand } from './handlers/commands/update-storage-location.handler';
import { DeleteStorageLocationCommand } from './handlers/commands/delete-storage-location.handler';
import { GetHouseStructureQuery } from './handlers/queries/get-house-structure.handler';
import { GetRoomListQuery } from './handlers/queries/get-room-list.handler';
import { GetFurniturePlacementListQuery } from './handlers/queries/get-furniture-placement-list.handler';
import { GetStorageLocationListQuery } from './handlers/queries/get-storage-location-list.handler';

@Injectable()
export class SpaceContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async 집_구조를_저장한다(
    data: SaveHouseStructureData,
  ): Promise<HouseStructureResult> {
    return this.commandBus.execute(
      new SaveHouseStructureCommand(
        data.householdId,
        data.name,
        data.structurePayload,
        data.diagramLayout,
      ),
    );
  }

  async 집_구조를_조회한다(
    householdId: string,
  ): Promise<HouseStructureResult | null> {
    return this.queryBus.execute(new GetHouseStructureQuery(householdId));
  }

  async 방을_동기화한다(data: SyncRoomsData): Promise<RoomResult[]> {
    return this.commandBus.execute(
      new SyncRoomsCommand(data.houseStructureId, data.rooms),
    );
  }

  async 방_목록을_조회한다(houseStructureId: string): Promise<RoomResult[]> {
    return this.queryBus.execute(new GetRoomListQuery(houseStructureId));
  }

  async 가구를_생성한다(
    data: CreateFurniturePlacementData,
  ): Promise<FurniturePlacementResult> {
    return this.commandBus.execute(
      new CreateFurniturePlacementCommand(
        data.roomId,
        data.label,
        data.productId,
        data.productVariantId,
        data.anchorDirectStorageId,
        data.sortOrder,
        data.placementPayload,
      ),
    );
  }

  async 가구를_수정한다(
    id: string,
    data: UpdateFurniturePlacementData,
  ): Promise<FurniturePlacementResult> {
    return this.commandBus.execute(
      new UpdateFurniturePlacementCommand(id, data),
    );
  }

  async 가구_목록을_조회한다(
    roomId: string,
  ): Promise<FurniturePlacementResult[]> {
    return this.queryBus.execute(new GetFurniturePlacementListQuery(roomId));
  }

  async 가구를_삭제한다(id: string): Promise<void> {
    return this.commandBus.execute(new DeleteFurniturePlacementCommand(id));
  }

  async 보관장소를_생성한다(
    data: CreateStorageLocationData,
  ): Promise<StorageLocationResult> {
    return this.commandBus.execute(
      new CreateStorageLocationCommand(
        data.householdId,
        data.name,
        data.roomId,
        data.furniturePlacementId,
        data.sortOrder,
      ),
    );
  }

  async 보관장소를_수정한다(
    id: string,
    householdId: string,
    data: UpdateStorageLocationData,
  ): Promise<StorageLocationResult> {
    return this.commandBus.execute(
      new UpdateStorageLocationCommand(id, householdId, data),
    );
  }

  async 보관장소를_삭제한다(id: string, householdId: string): Promise<void> {
    return this.commandBus.execute(
      new DeleteStorageLocationCommand(id, householdId),
    );
  }

  async 보관장소_목록을_조회한다(
    householdId: string,
  ): Promise<StorageLocationResult[]> {
    return this.queryBus.execute(new GetStorageLocationListQuery(householdId));
  }
}
