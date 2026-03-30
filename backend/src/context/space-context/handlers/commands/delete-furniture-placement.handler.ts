import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { FurniturePlacementService } from '../../../../domain/furniture-placement/furniture-placement.service';

export class DeleteFurniturePlacementCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteFurniturePlacementCommand)
export class DeleteFurniturePlacementHandler
  implements ICommandHandler<DeleteFurniturePlacementCommand>
{
  constructor(
    private readonly furniturePlacementService: FurniturePlacementService,
  ) {}

  async execute(command: DeleteFurniturePlacementCommand): Promise<void> {
    const deleted = await this.furniturePlacementService.가구를_삭제한다(
      command.id,
    );
    if (!deleted) {
      throw new NotFoundException('가구 배치를 찾을 수 없습니다');
    }
  }
}
