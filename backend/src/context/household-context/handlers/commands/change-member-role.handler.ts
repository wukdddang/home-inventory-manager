import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HouseholdMemberService } from '../../../../domain/household/household-member.service';

export class ChangeMemberRoleCommand {
  constructor(
    public readonly memberId: string,
    public readonly requestingUserId: string,
    public readonly role: 'admin' | 'editor' | 'viewer',
  ) {}
}

@CommandHandler(ChangeMemberRoleCommand)
export class ChangeMemberRoleHandler
  implements ICommandHandler<ChangeMemberRoleCommand>
{
  constructor(
    private readonly householdMemberService: HouseholdMemberService,
  ) {}

  async execute(command: ChangeMemberRoleCommand): Promise<void> {
    const member = await this.householdMemberService.ID로_멤버를_조회한다(
      command.memberId,
    );
    if (!member) {
      throw new NotFoundException('멤버를 찾을 수 없습니다');
    }

    if (member.userId === command.requestingUserId) {
      throw new BadRequestException(
        '자기 자신의 역할은 변경할 수 없습니다',
      );
    }

    if (member.role === 'admin') {
      const adminCount =
        await this.householdMemberService.거점의_admin_수를_조회한다(
          member.householdId,
        );
      if (adminCount <= 1) {
        throw new BadRequestException(
          '마지막 관리자의 역할은 변경할 수 없습니다',
        );
      }
    }

    member.role = command.role;
    await this.householdMemberService.멤버를_저장한다(member);
  }
}
