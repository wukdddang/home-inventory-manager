import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseStructure } from './house-structure.entity';

@Injectable()
export class HouseStructureService {
  constructor(
    @InjectRepository(HouseStructure)
    private readonly repository: Repository<HouseStructure>,
  ) {}

  async 거점의_집_구조를_조회한다(
    householdId: string,
  ): Promise<HouseStructure | null> {
    return this.repository.findOne({ where: { householdId } });
  }

  async 집_구조를_저장한다(data: {
    householdId: string;
    name: string;
    structurePayload: Record<string, any>;
    diagramLayout?: Record<string, any> | null;
  }): Promise<HouseStructure> {
    const existing = await this.거점의_집_구조를_조회한다(data.householdId);

    if (existing) {
      Object.assign(existing, data);
      return this.repository.save(existing);
    }

    const structure = this.repository.create(data);
    return this.repository.save(structure);
  }
}
