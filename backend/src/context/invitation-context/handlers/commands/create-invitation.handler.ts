import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomBytes } from 'crypto';
import { HouseholdInvitationService } from '../../../../domain/household-invitation/household-invitation.service';
import { InvitationResult } from '../../interfaces/invitation-context.interface';

export class CreateInvitationCommand {
  constructor(
    public readonly householdId: string,
    public readonly invitedByUserId: string,
    public readonly role: 'admin' | 'editor' | 'viewer',
    public readonly inviteeEmail: string | null,
    public readonly expiresInDays: number,
  ) {}
}

@CommandHandler(CreateInvitationCommand)
export class CreateInvitationHandler
  implements ICommandHandler<CreateInvitationCommand>
{
  constructor(
    private readonly invitationService: HouseholdInvitationService,
  ) {}

  async execute(command: CreateInvitationCommand): Promise<InvitationResult> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + command.expiresInDays);

    const invitation = await this.invitationService.초대를_생성한다({
      householdId: command.householdId,
      invitedByUserId: command.invitedByUserId,
      role: command.role,
      token,
      inviteeEmail: command.inviteeEmail,
      expiresAt,
    });

    // 릴레이션 포함해서 다시 조회
    const saved =
      await this.invitationService.토큰으로_초대를_조회한다(token);

    return {
      id: invitation.id,
      householdId: invitation.householdId,
      householdName: saved?.household?.name ?? '',
      invitedByUserId: invitation.invitedByUserId,
      invitedByDisplayName: saved?.invitedByUser?.displayName ?? '',
      role: invitation.role,
      token: invitation.token,
      status: invitation.status,
      inviteeEmail: invitation.inviteeEmail,
      acceptedByUserId: invitation.acceptedByUserId,
      acceptedAt: invitation.acceptedAt,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }
}
