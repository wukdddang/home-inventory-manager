import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { HouseholdInvitationService } from '../../../../domain/household-invitation/household-invitation.service';
import { HouseholdMemberService } from '../../../../domain/household/household-member.service';

export class AcceptInvitationCommand {
  constructor(
    public readonly token: string,
    public readonly userId: string,
    public readonly userEmail: string,
  ) {}
}

@CommandHandler(AcceptInvitationCommand)
export class AcceptInvitationHandler
  implements ICommandHandler<AcceptInvitationCommand>
{
  constructor(
    private readonly invitationService: HouseholdInvitationService,
    private readonly householdMemberService: HouseholdMemberService,
  ) {}

  async execute(command: AcceptInvitationCommand): Promise<void> {
    const invitation =
      await this.invitationService.토큰으로_초대를_조회한다(command.token);

    if (!invitation) {
      throw new NotFoundException('초대를 찾을 수 없습니다');
    }

    // 만료 체크
    if (invitation.expiresAt < new Date()) {
      if (invitation.status === 'pending') {
        invitation.status = 'expired';
        await this.invitationService.초대를_저장한다(invitation);
      }
      throw new BadRequestException('만료된 초대입니다');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException(
        `이미 처리된 초대입니다 (상태: ${invitation.status})`,
      );
    }

    // 이메일 초대인 경우 이메일 검증
    if (
      invitation.inviteeEmail &&
      invitation.inviteeEmail !== command.userEmail
    ) {
      throw new ForbiddenException('이 초대는 다른 이메일로 전송되었습니다');
    }

    // 이미 멤버인지 확인
    const existingMember = await this.householdMemberService.멤버를_조회한다(
      command.userId,
      invitation.householdId,
    );
    if (existingMember) {
      throw new ConflictException('이미 해당 거점의 멤버입니다');
    }

    // 멤버 추가
    await this.householdMemberService.멤버를_추가한다({
      userId: command.userId,
      householdId: invitation.householdId,
      role: invitation.role,
    });

    // 초대 상태 업데이트
    invitation.status = 'accepted';
    invitation.acceptedByUserId = command.userId;
    invitation.acceptedAt = new Date();
    await this.invitationService.초대를_저장한다(invitation);
  }
}
