import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RoomService } from '../../../../domain/room/room.service';
import { RoomResult } from '../../interfaces/space-context.interface';

export class SyncRoomsCommand {
  constructor(
    public readonly houseStructureId: string,
    public readonly rooms: {
      structureRoomKey: string;
      displayName?: string | null;
      sortOrder: number;
    }[],
  ) {}
}

@CommandHandler(SyncRoomsCommand)
export class SyncRoomsHandler implements ICommandHandler<SyncRoomsCommand> {
  constructor(private readonly roomService: RoomService) {}

  async execute(command: SyncRoomsCommand): Promise<RoomResult[]> {
    const rooms = await this.roomService.방을_동기화한다(
      command.houseStructureId,
      command.rooms,
    );

    return rooms.map((room) => ({
      id: room.id,
      houseStructureId: room.houseStructureId,
      structureRoomKey: room.structureRoomKey,
      displayName: room.displayName,
      sortOrder: room.sortOrder,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    }));
  }
}
