import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { StorageLocationService } from '../../../../domain/storage-location/storage-location.service';
import { StorageLocationResult } from '../../interfaces/space-context.interface';

export class CreateStorageLocationCommand {
  constructor(
    public readonly householdId: string,
    public readonly name: string,
    public readonly roomId?: string | null,
    public readonly furniturePlacementId?: string | null,
    public readonly applianceId?: string | null,
    public readonly sortOrder?: number,
  ) {}
}

@CommandHandler(CreateStorageLocationCommand)
export class CreateStorageLocationHandler
  implements ICommandHandler<CreateStorageLocationCommand>
{
  constructor(
    private readonly storageLocationService: StorageLocationService,
  ) {}

  async execute(
    command: CreateStorageLocationCommand,
  ): Promise<StorageLocationResult> {
    const location = await this.storageLocationService.보관장소를_생성한다({
      householdId: command.householdId,
      name: command.name,
      roomId: command.roomId,
      furniturePlacementId: command.furniturePlacementId,
      applianceId: command.applianceId,
      sortOrder: command.sortOrder,
    });

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
