import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { StorageLocationService } from '../../../../domain/storage-location/storage-location.service';

export class DeleteStorageLocationCommand {
  constructor(
    public readonly id: string,
    public readonly householdId: string,
  ) {}
}

@CommandHandler(DeleteStorageLocationCommand)
export class DeleteStorageLocationHandler
  implements ICommandHandler<DeleteStorageLocationCommand>
{
  constructor(
    private readonly storageLocationService: StorageLocationService,
  ) {}

  async execute(command: DeleteStorageLocationCommand): Promise<void> {
    const deleted = await this.storageLocationService.보관장소를_삭제한다(
      command.id,
      command.householdId,
    );
    if (!deleted) {
      throw new NotFoundException('보관장소를 찾을 수 없습니다');
    }
  }
}
