import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageLocation } from './storage-location.entity';

@Injectable()
export class StorageLocationService {
  constructor(
    @InjectRepository(StorageLocation)
    private readonly repository: Repository<StorageLocation>,
  ) {}

  async 거점의_보관장소_목록을_조회한다(
    householdId: string,
  ): Promise<StorageLocation[]> {
    return this.repository.find({
      where: { householdId },
      relations: ['room', 'furniturePlacement'],
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async ID로_보관장소를_조회한다(
    id: string,
  ): Promise<StorageLocation | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['room', 'furniturePlacement'],
    });
  }

  async 보관장소를_생성한다(data: {
    householdId: string;
    name: string;
    roomId?: string | null;
    furniturePlacementId?: string | null;
    applianceId?: string | null;
    sortOrder?: number;
  }): Promise<StorageLocation> {
    const location = this.repository.create(data);
    return this.repository.save(location);
  }

  async 보관장소를_수정한다(
    id: string,
    householdId: string,
    data: {
      name?: string;
      roomId?: string | null;
      furniturePlacementId?: string | null;
      applianceId?: string | null;
      sortOrder?: number;
    },
  ): Promise<StorageLocation | null> {
    const location = await this.repository.findOne({
      where: { id, householdId },
    });
    if (!location) return null;

    Object.assign(location, data);
    return this.repository.save(location);
  }

  async 보관장소를_삭제한다(
    id: string,
    householdId: string,
  ): Promise<boolean> {
    const result = await this.repository.delete({ id, householdId });
    return (result.affected ?? 0) > 0;
  }
}
