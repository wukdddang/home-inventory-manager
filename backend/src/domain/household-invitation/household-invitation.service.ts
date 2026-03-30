import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseholdInvitation } from './household-invitation.entity';

@Injectable()
export class HouseholdInvitationService {
  constructor(
    @InjectRepository(HouseholdInvitation)
    private readonly invitationRepository: Repository<HouseholdInvitation>,
  ) {}

  async 초대를_생성한다(data: {
    householdId: string;
    invitedByUserId: string;
    role: 'admin' | 'editor' | 'viewer';
    token: string;
    inviteeEmail: string | null;
    expiresAt: Date;
  }): Promise<HouseholdInvitation> {
    const invitation = this.invitationRepository.create({
      ...data,
      status: 'pending',
    });
    return this.invitationRepository.save(invitation);
  }

  async 토큰으로_초대를_조회한다(
    token: string,
  ): Promise<HouseholdInvitation | null> {
    return this.invitationRepository.findOne({
      where: { token },
      relations: ['household', 'invitedByUser'],
    });
  }

  async ID로_초대를_조회한다(
    id: string,
  ): Promise<HouseholdInvitation | null> {
    return this.invitationRepository.findOne({ where: { id } });
  }

  async 거점의_대기중_초대_목록을_조회한다(
    householdId: string,
  ): Promise<HouseholdInvitation[]> {
    return this.invitationRepository.find({
      where: { householdId, status: 'pending' },
      relations: ['invitedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async 초대를_저장한다(
    invitation: HouseholdInvitation,
  ): Promise<HouseholdInvitation> {
    return this.invitationRepository.save(invitation);
  }

  async 만료된_초대를_일괄_처리한다(): Promise<number> {
    const result = await this.invitationRepository
      .createQueryBuilder()
      .update(HouseholdInvitation)
      .set({ status: 'expired' })
      .where('status = :status', { status: 'pending' })
      .andWhere('expiresAt < NOW()')
      .execute();
    return result.affected ?? 0;
  }
}
