import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { HouseholdInvitationService } from '../../../../domain/household-invitation/household-invitation.service';
import { InvitationResult } from '../../interfaces/invitation-context.interface';

export class GetInvitationListQuery {
  constructor(public readonly householdId: string) {}
}

@QueryHandler(GetInvitationListQuery)
export class GetInvitationListHandler
  implements IQueryHandler<GetInvitationListQuery>
{
  constructor(
    private readonly invitationService: HouseholdInvitationService,
  ) {}

  async execute(query: GetInvitationListQuery): Promise<InvitationResult[]> {
    const invitations =
      await this.invitationService.거점의_대기중_초대_목록을_조회한다(
        query.householdId,
      );

    return invitations.map((inv) => ({
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
    }));
  }
}
