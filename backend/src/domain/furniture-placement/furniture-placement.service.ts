import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FurniturePlacement } from './furniture-placement.entity';

@Injectable()
export class FurniturePlacementService {
  constructor(
    @InjectRepository(FurniturePlacement)
    private readonly repository: Repository<FurniturePlacement>,
  ) {}

  async 방의_가구_목록을_조회한다(roomId: string): Promise<FurniturePlacement[]> {
    return this.repository.find({
      where: { roomId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async ID로_가구를_조회한다(id: string): Promise<FurniturePlacement | null> {
    return this.repository.findOne({ where: { id } });
  }

  async 가구를_생성한다(data: {
    roomId: string;
    label: string;
    productId?: string | null;
    productVariantId?: string | null;
    anchorDirectStorageId?: string | null;
    sortOrder?: number;
    placementPayload?: Record<string, any> | null;
  }): Promise<FurniturePlacement> {
    const furniture = this.repository.create(data);
    return this.repository.save(furniture);
  }

  async 가구를_수정한다(
    id: string,
    data: {
      label?: string;
      productId?: string | null;
      productVariantId?: string | null;
      anchorDirectStorageId?: string | null;
      sortOrder?: number;
      placementPayload?: Record<string, any> | null;
    },
  ): Promise<FurniturePlacement | null> {
    const furniture = await this.ID로_가구를_조회한다(id);
    if (!furniture) return null;

    Object.assign(furniture, data);
    return this.repository.save(furniture);
  }

  async 가구를_삭제한다(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
