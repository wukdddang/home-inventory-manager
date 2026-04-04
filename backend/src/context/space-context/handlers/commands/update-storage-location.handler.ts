import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { StorageLocationService } from '../../../../domain/storage-location/storage-location.service';
import {
  UpdateStorageLocationData,
  StorageLocationResult,
} from '../../interfaces/space-context.interface';

export class UpdateStorageLocationCommand {
  constructor(
    public readonly id: string,
    public readonly householdId: string,
    public readonly data: UpdateStorageLocationData,
  ) {}
}

@CommandHandler(UpdateStorageLocationCommand)
export class UpdateStorageLocationHandler
  implements ICommandHandler<UpdateStorageLocationCommand>
{
  constructor(
    private readonly storageLocationService: StorageLocationService,
  ) {}

  async execute(
    command: UpdateStorageLocationCommand,
  ): Promise<StorageLocationResult> {
    const location = await this.storageLocationService.보관장소를_수정한다(
      command.id,
      command.householdId,
      command.data,
    );
    if (!location) {
      throw new NotFoundException('보관장소를 찾을 수 없습니다');
    }

    return {
      id: location.id,
      householdId: location.householdId,
      name: location.name,
      roomId: location.roomId,
      furniturePlacementId: location.furniturePlacementId,
      applianceId: location.applianceId,
      sortOrder: location.sortOrder,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    };
  }
}
