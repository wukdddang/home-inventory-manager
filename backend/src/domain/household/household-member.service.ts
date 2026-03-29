import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseholdMember } from './household-member.entity';

@Injectable()
export class HouseholdMemberService {
  constructor(
    @InjectRepository(HouseholdMember)
    private readonly memberRepository: Repository<HouseholdMember>,
  ) {}

  async 멤버를_조회한다(
    userId: string,
    householdId: string,
  ): Promise<HouseholdMember | null> {
    return this.memberRepository.findOne({
      where: { userId, householdId },
    });
  }

  async ID로_멤버를_조회한다(id: string): Promise<HouseholdMember | null> {
    return this.memberRepository.findOne({ where: { id } });
  }

  async 거점의_멤버_목록을_조회한다(
    householdId: string,
  ): Promise<HouseholdMember[]> {
    return this.memberRepository.find({
      where: { householdId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async 사용자의_거점_목록을_조회한다(
    userId: string,
  ): Promise<HouseholdMember[]> {
    return this.memberRepository.find({
      where: { userId },
      relations: ['household'],
      order: { createdAt: 'ASC' },
    });
  }

  async 멤버를_추가한다(data: {
    userId: string;
    householdId: string;
    role: 'admin' | 'editor' | 'viewer';
  }): Promise<HouseholdMember> {
    const member = this.memberRepository.create(data);
    return this.memberRepository.save(member);
  }

  async 멤버를_저장한다(member: HouseholdMember): Promise<HouseholdMember> {
    return this.memberRepository.save(member);
  }

  async 멤버를_삭제한다(id: string): Promise<boolean> {
    const result = await this.memberRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async 거점의_admin_수를_조회한다(householdId: string): Promise<number> {
    return this.memberRepository.count({
      where: { householdId, role: 'admin' },
    });
  }
}
