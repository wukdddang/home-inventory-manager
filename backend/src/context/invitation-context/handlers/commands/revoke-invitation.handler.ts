import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { HouseholdInvitationService } from '../../../../domain/household-invitation/household-invitation.service';

export class RevokeInvitationCommand {
  constructor(
    public readonly invitationId: string,
    public readonly householdId: string,
  ) {}
}

@CommandHandler(RevokeInvitationCommand)
export class RevokeInvitationHandler
  implements ICommandHandler<RevokeInvitationCommand>
{
  constructor(
    private readonly invitationService: HouseholdInvitationService,
  ) {}

  async execute(command: RevokeInvitationCommand): Promise<void> {
    const invitation = await this.invitationService.ID로_초대를_조회한다(
      command.invitationId,
    );

    if (!invitation || invitation.householdId !== command.householdId) {
      throw new NotFoundException('초대를 찾을 수 없습니다');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException('대기 중인 초대만 취소할 수 있습니다');
    }

    invitation.status = 'revoked';
    await this.invitationService.초대를_저장한다(invitation);
  }
}
