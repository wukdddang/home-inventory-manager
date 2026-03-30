import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Room } from './room.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly repository: Repository<Room>,
  ) {}

  async 방_목록을_조회한다(houseStructureId: string): Promise<Room[]> {
    return this.repository.find({
      where: { houseStructureId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async ID로_방을_조회한다(id: string): Promise<Room | null> {
    return this.repository.findOne({ where: { id } });
  }

  async 방을_동기화한다(
    houseStructureId: string,
    rooms: { structureRoomKey: string; displayName?: string | null; sortOrder: number }[],
  ): Promise<Room[]> {
    const existing = await this.방_목록을_조회한다(houseStructureId);
    const existingKeyMap = new Map(existing.map((r) => [r.structureRoomKey, r]));
    const incomingKeys = new Set(rooms.map((r) => r.structureRoomKey));

    // 삭제: incoming에 없는 기존 방
    const toDelete = existing.filter((r) => !incomingKeys.has(r.structureRoomKey));
    if (toDelete.length > 0) {
      await this.repository.delete({ id: In(toDelete.map((r) => r.id)) });
    }

    // 추가/수정
    const toSave: Room[] = [];
    for (const incoming of rooms) {
      const ex = existingKeyMap.get(incoming.structureRoomKey);
      if (ex) {
        ex.displayName = incoming.displayName ?? ex.displayName;
        ex.sortOrder = incoming.sortOrder;
        toSave.push(ex);
      } else {
        toSave.push(
          this.repository.create({
            houseStructureId,
            ...incoming,
          }),
        );
      }
    }

    return this.repository.save(toSave);
  }
}
