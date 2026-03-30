import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { HouseholdInvitationService } from '../../../../domain/household-invitation/household-invitation.service';
import { InvitationResult } from '../../interfaces/invitation-context.interface';

export class GetInvitationByTokenQuery {
  constructor(public readonly token: string) {}
}

@QueryHandler(GetInvitationByTokenQuery)
export class GetInvitationByTokenHandler
  implements IQueryHandler<GetInvitationByTokenQuery>
{
  constructor(
    private readonly invitationService: HouseholdInvitationService,
  ) {}

  async execute(
    query: GetInvitationByTokenQuery,
  ): Promise<InvitationResult> {
    const inv =
      await this.invitationService.토큰으로_초대를_조회한다(query.token);

    if (!inv) {
      throw new NotFoundException('초대를 찾을 수 없습니다');
    }

    // 만료 자동 처리
    if (inv.status === 'pending' && inv.expiresAt < new Date()) {
      inv.status = 'expired';
      await this.invitationService.초대를_저장한다(inv);
    }

    return {
      id: inv.id,
      householdId: inv.householdId,
      householdName: inv.household?.name ?? '',
      invitedByUserId: inv.invitedByUserId,
      invitedByDisplayName: inv.invitedByUser?.displayName ?? '',
      role: inv.role,
      token: inv.token,
      status: inv.status,
      inviteeEmail: inv.inviteeEmail,
      acceptedByUserId: inv.acceptedByUserId,
      acceptedAt: inv.acceptedAt,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    };
  }
}
