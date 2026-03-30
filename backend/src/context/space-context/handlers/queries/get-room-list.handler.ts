import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RoomService } from '../../../../domain/room/room.service';
import { RoomResult } from '../../interfaces/space-context.interface';

export class GetRoomListQuery {
  constructor(public readonly houseStructureId: string) {}
}

@QueryHandler(GetRoomListQuery)
export class GetRoomListHandler implements IQueryHandler<GetRoomListQuery> {
  constructor(private readonly roomService: RoomService) {}

  async execute(query: GetRoomListQuery): Promise<RoomResult[]> {
    const rooms = await this.roomService.방_목록을_조회한다(
      query.houseStructureId,
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
