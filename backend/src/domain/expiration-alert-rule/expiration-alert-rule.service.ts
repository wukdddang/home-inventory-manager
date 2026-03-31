import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpirationAlertRule } from './expiration-alert-rule.entity';

@Injectable()
export class ExpirationAlertRuleService {
  constructor(
    @InjectRepository(ExpirationAlertRule)
    private readonly repo: Repository<ExpirationAlertRule>,
  ) {}

  async 만료_알림_규칙_목록을_조회한다(
    householdId: string,
  ): Promise<ExpirationAlertRule[]> {
    return this.repo.find({
      where: { householdId },
      relations: ['product'],
      order: { createdAt: 'ASC' },
    });
  }

  async 만료_알림_규칙을_저장한다(data: {
    productId: string;
    userId?: string | null;
    householdId?: string | null;
    daysBefore: number;
    isActive?: boolean;
  }): Promise<ExpirationAlertRule> {
    const rule = this.repo.create(data);
    return this.repo.save(rule);
  }

  async 만료_알림_규칙을_수정한다(
    id: string,
    data: {
      daysBefore?: number;
      isActive?: boolean;
    },
  ): Promise<ExpirationAlertRule | null> {
    const result = await this.repo.update({ id }, data);
    if ((result.affected ?? 0) === 0) return null;
    return this.repo.findOne({ where: { id }, relations: ['product'] });
  }

  async 만료_알림_규칙을_삭제한다(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
