import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseholdKindDefinition } from './household-kind-definition.entity';

export const DEFAULT_KIND_DEFINITIONS = [
  { kindId: 'home', label: '집', sortOrder: 0 },
  { kindId: 'office', label: '사무실', sortOrder: 1 },
  { kindId: 'vehicle', label: '차량', sortOrder: 2 },
  { kindId: 'other', label: '기타', sortOrder: 3 },
];

@Injectable()
export class HouseholdKindDefinitionService {
  constructor(
    @InjectRepository(HouseholdKindDefinition)
    private readonly repository: Repository<HouseholdKindDefinition>,
  ) {}

  async 사용자의_유형_목록을_조회한다(
    userId: string,
  ): Promise<HouseholdKindDefinition[]> {
    return this.repository.find({
      where: { userId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async 기본_유형을_시드한다(userId: string): Promise<HouseholdKindDefinition[]> {
    const definitions = DEFAULT_KIND_DEFINITIONS.map((def) =>
      this.repository.create({ userId, ...def }),
    );
    return this.repository.save(definitions);
  }

  async 유형_목록을_일괄_저장한다(
    userId: string,
    items: { kindId: string; label: string; sortOrder: number }[],
  ): Promise<HouseholdKindDefinition[]> {
    // 기존 목록 삭제 후 새 목록 저장
    await this.repository.delete({ userId });

    const definitions = items.map((item) =>
      this.repository.create({ userId, ...item }),
    );
    return this.repository.save(definitions);
  }
}
