import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { FurniturePlacementService } from '../../../../domain/furniture-placement/furniture-placement.service';
import {
  UpdateFurniturePlacementData,
  FurniturePlacementResult,
} from '../../interfaces/space-context.interface';

export class UpdateFurniturePlacementCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateFurniturePlacementData,
  ) {}
}

@CommandHandler(UpdateFurniturePlacementCommand)
export class UpdateFurniturePlacementHandler
  implements ICommandHandler<UpdateFurniturePlacementCommand>
{
  constructor(
    private readonly furniturePlacementService: FurniturePlacementService,
  ) {}

  async execute(
    command: UpdateFurniturePlacementCommand,
  ): Promise<FurniturePlacementResult> {
    const placement = await this.furniturePlacementService.가구를_수정한다(
      command.id,
      command.data,
    );
    if (!placement) {
      throw new NotFoundException('가구 배치를 찾을 수 없습니다');
    }

    return {
      id: placement.id,
      roomId: placement.roomId,
      label: placement.label,
      productId: placement.productId,
      productVariantId: placement.productVariantId,
      anchorDirectStorageId: placement.anchorDirectStorageId,
      sortOrder: placement.sortOrder,
      placementPayload: placement.placementPayload,
      createdAt: placement.createdAt,
      updatedAt: placement.updatedAt,
    };
  }
}
