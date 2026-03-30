import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HouseStructureModule } from '../../domain/house-structure/house-structure.module';
import { RoomModule } from '../../domain/room/room.module';
import { FurniturePlacementModule } from '../../domain/furniture-placement/furniture-placement.module';
import { StorageLocationModule } from '../../domain/storage-location/storage-location.module';
import { SpaceContextService } from './space-context.service';
import { SaveHouseStructureHandler } from './handlers/commands/save-house-structure.handler';
import { SyncRoomsHandler } from './handlers/commands/sync-rooms.handler';
import { CreateFurniturePlacementHandler } from './handlers/commands/create-furniture-placement.handler';
import { UpdateFurniturePlacementHandler } from './handlers/commands/update-furniture-placement.handler';
import { DeleteFurniturePlacementHandler } from './handlers/commands/delete-furniture-placement.handler';
import { CreateStorageLocationHandler } from './handlers/commands/create-storage-location.handler';
import { UpdateStorageLocationHandler } from './handlers/commands/update-storage-location.handler';
import { DeleteStorageLocationHandler } from './handlers/commands/delete-storage-location.handler';
import { GetHouseStructureHandler } from './handlers/queries/get-house-structure.handler';
import { GetRoomListHandler } from './handlers/queries/get-room-list.handler';
import { GetFurniturePlacementListHandler } from './handlers/queries/get-furniture-placement-list.handler';
import { GetStorageLocationListHandler } from './handlers/queries/get-storage-location-list.handler';

const CommandHandlers = [
  SaveHouseStructureHandler,
  SyncRoomsHandler,
  CreateFurniturePlacementHandler,
  UpdateFurniturePlacementHandler,
  DeleteFurniturePlacementHandler,
  CreateStorageLocationHandler,
  UpdateStorageLocationHandler,
  DeleteStorageLocationHandler,
];

const QueryHandlers = [
  GetHouseStructureHandler,
  GetRoomListHandler,
  GetFurniturePlacementListHandler,
  GetStorageLocationListHandler,
];

@Module({
  imports: [
    CqrsModule,
    HouseStructureModule,
    RoomModule,
    FurniturePlacementModule,
    StorageLocationModule,
  ],
  providers: [SpaceContextService, ...CommandHandlers, ...QueryHandlers],
  exports: [SpaceContextService],
})
export class SpaceContextModule {}
