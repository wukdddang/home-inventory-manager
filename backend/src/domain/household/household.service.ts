import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Household } from './household.entity';

@Injectable()
export class HouseholdService {
  constructor(
    @InjectRepository(Household)
    private readonly householdRepository: Repository<Household>,
  ) {}

  async 거점을_생성한다(data: {
    name: string;
    kind?: string;
  }): Promise<Household> {
    const household = this.householdRepository.create(data);
    return this.householdRepository.save(household);
  }

  async ID로_거점을_조회한다(id: string): Promise<Household | null> {
    return this.householdRepository.findOne({ where: { id } });
  }

  async 거점을_수정한다(
    id: string,
    data: { name?: string; kind?: string | null },
  ): Promise<Household | null> {
    const household = await this.ID로_거점을_조회한다(id);
    if (!household) return null;

    Object.assign(household, data);
    return this.householdRepository.save(household);
  }

  async 거점을_삭제한다(id: string): Promise<boolean> {
    const result = await this.householdRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
