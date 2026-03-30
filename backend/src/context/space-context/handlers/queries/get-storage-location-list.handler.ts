import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { StorageLocationService } from '../../../../domain/storage-location/storage-location.service';
import { StorageLocationResult } from '../../interfaces/space-context.interface';

export class GetStorageLocationListQuery {
  constructor(public readonly householdId: string) {}
}

@QueryHandler(GetStorageLocationListQuery)
export class GetStorageLocationListHandler
  implements IQueryHandler<GetStorageLocationListQuery>
{
  constructor(
    private readonly storageLocationService: StorageLocationService,
  ) {}

  async execute(
    query: GetStorageLocationListQuery,
  ): Promise<StorageLocationResult[]> {
    const locations =
      await this.storageLocationService.거점의_보관장소_목록을_조회한다(
        query.householdId,
      );

    return locations.map((location) => ({
      id: location.id,
      householdId: location.householdId,
      name: location.name,
      roomId: location.roomId,
      furniturePlacementId: location.furniturePlacementId,
      sortOrder: location.sortOrder,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    }));
  }
}
