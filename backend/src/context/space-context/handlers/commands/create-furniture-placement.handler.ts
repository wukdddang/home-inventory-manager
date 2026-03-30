import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FurniturePlacementService } from '../../../../domain/furniture-placement/furniture-placement.service';
import { FurniturePlacementResult } from '../../interfaces/space-context.interface';

export class CreateFurniturePlacementCommand {
  constructor(
    public readonly roomId: string,
    public readonly label: string,
    public readonly productId?: string | null,
    public readonly productVariantId?: string | null,
    public readonly anchorDirectStorageId?: string | null,
    public readonly sortOrder?: number,
    public readonly placementPayload?: Record<string, any> | null,
  ) {}
}

@CommandHandler(CreateFurniturePlacementCommand)
export class CreateFurniturePlacementHandler
  implements ICommandHandler<CreateFurniturePlacementCommand>
{
  constructor(
    private readonly furniturePlacementService: FurniturePlacementService,
  ) {}

  async execute(
    command: CreateFurniturePlacementCommand,
  ): Promise<FurniturePlacementResult> {
    const placement = await this.furniturePlacementService.가구를_생성한다({
      roomId: command.roomId,
      label: command.label,
      productId: command.productId,
      productVariantId: command.productVariantId,
      anchorDirectStorageId: command.anchorDirectStorageId,
      sortOrder: command.sortOrder,
      placementPayload: command.placementPayload,
    });

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
